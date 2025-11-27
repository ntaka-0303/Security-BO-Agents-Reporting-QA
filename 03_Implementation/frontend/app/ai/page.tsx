'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import useSWR from "swr";

import { api, swrFetcher } from "@/lib/apiClient";
import { MODEL_PROFILES, REPORT_PREVIEWS } from "@/lib/constants";
import type { AiResponseRead, InquiryRead, InquirySummary, TriageResult } from "@/lib/types";

function maskSensitive(text: string) {
  return text.replace(/\d{4,}/g, (match) => `${"*".repeat(Math.max(match.length - 4, 0))}${match.slice(-4)}`);
}

export default function AiPage() {
  const searchParams = useSearchParams();
  const initialInquiry = searchParams.get("inquiry") ?? "";

  const [selectedInquiryId, setSelectedInquiryId] = useState(initialInquiry);
  const [inquiryDetail, setInquiryDetail] = useState<InquiryRead | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [modelProfile, setModelProfile] = useState(MODEL_PROFILES[0].id);
  const [consent, setConsent] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiResponseRead | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [operatorConfidence, setOperatorConfidence] = useState(0.7);
  const [isPending, startTransition] = useTransition();

  const { data: inquiries } = useSWR<InquirySummary[]>("/inquiries", swrFetcher);

  useEffect(() => {
    if (!selectedInquiryId) {
      setInquiryDetail(null);
      return;
    }
    let mounted = true;
    setDetailError(null);
    api
      .getInquiry(selectedInquiryId)
      .then((data) => {
        if (mounted) {
          setInquiryDetail(data);
          setNotes(data.question_text.slice(0, 200));
        }
      })
      .catch((error) => {
        if (mounted) {
          setInquiryDetail(null);
          setDetailError(error instanceof Error ? error.message : "問い合わせを取得できませんでした。");
        }
      });
    return () => {
      mounted = false;
    };
  }, [selectedInquiryId]);

  const maskedQuestion = useMemo(() => {
    return inquiryDetail ? maskSensitive(inquiryDetail.question_text) : "";
  }, [inquiryDetail]);

  const disableGeneration = !selectedInquiryId || !inquiryDetail || !consent;

  function handleGenerate() {
    if (disableGeneration) return;
    setTriageResult(null);
    startTransition(async () => {
      try {
        const response = await api.generateAiResponse({
          inquiry_id: selectedInquiryId,
          prompt_overrides: {
            model_profile: modelProfile,
            operator_notes: notes,
            masked_question: maskedQuestion
          }
        });
        setAiResponse(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : "AI生成に失敗しました。";
        setDetailError(message);
        setAiResponse(null);
      }
    });
  }

  function handleTriage() {
    if (!aiResponse || !inquiryDetail) return;
    startTransition(async () => {
      try {
        const triage = await api.runTriage({
          inquiry_id: inquiryDetail.inquiry_id,
          ai_response_id: aiResponse.ai_response_id,
          edit_distance: 0,
          operator_confidence: operatorConfidence
        });
        setTriageResult(triage);
      } catch (error) {
        const message = error instanceof Error ? error.message : "判定サポートに失敗しました。";
        setDetailError(message);
      }
    });
  }

  return (
    <main className="space-y-6">
      <header className="card space-y-1">
        <p className="text-xs font-semibold text-brand">AIN-001 / AIN-002</p>
        <h2 className="text-xl font-semibold">AI入力フォーム＋レビュー支援</h2>
        <p className="text-sm text-slate-500">
          帳票プレビュー、マスキング、モデル選択、判定ロジックまで F-003〜F-007 の要件に沿って操作できます。
        </p>
      </header>

      <section className="card space-y-4">
        <h3 className="text-lg font-semibold">1. 対象問い合わせの選択</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-3 md:col-span-2">
            <label className="text-sm">
              問い合わせID
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={selectedInquiryId}
                onChange={(event) => setSelectedInquiryId(event.target.value)}
                placeholder="UUID"
              />
            </label>
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                最新 10 件から選択: 該当行をクリックすると ID が入力欄に反映されます。INQ-001 で登録した ID を入力して
                AI 処理へ進みます。
              </p>
              <div className="mt-3 divide-y">
                {inquiries?.slice(0, 10).map((item) => (
                  <button
                    type="button"
                    key={item.inquiry_id}
                    className="flex w-full items-center justify-between py-1 text-left text-slate-700 hover:text-brand"
                    onClick={() => setSelectedInquiryId(item.inquiry_id)}
                  >
                    <span className="text-sm font-medium">{item.inquiry_category}</span>
                    <span className="text-xs font-mono">{item.inquiry_id}</span>
                  </button>
                )) ?? <p className="py-2 text-slate-500">問い合わせデータがありません。</p>}
              </div>
            </div>
          </div>
          <div className="rounded border border-slate-200 p-3 text-sm">
            <p className="text-xs uppercase text-slate-500">手順</p>
            <ol className="list-decimal space-y-1 pl-4 text-slate-600">
              <li>ID を入力または一覧から選択</li>
              <li>AI連携に必要なオプションを設定</li>
              <li>AI 回答生成 → 判定ロジックへ</li>
            </ol>
          </div>
        </div>
        {detailError && <p className="text-sm text-rose-600">{detailError}</p>}
      </section>

      {inquiryDetail && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">2. 問い合わせコンテキスト</h3>
            <span className="badge">{inquiryDetail.inquiry_category}</span>
          </div>
          <dl className="grid gap-4 md:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-500">顧客</dt>
              <dd className="font-medium">{inquiryDetail.customer_attributes?.customer_name ?? inquiryDetail.customer_id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">AI連携</dt>
              <dd className="font-medium">{inquiryDetail.ai_enabled ? "ON" : "OFF"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">登録日時</dt>
              <dd>{new Date(inquiryDetail.created_at).toLocaleString("ja-JP")}</dd>
            </div>
          </dl>
          <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold">問い合わせ本文</p>
            <p className="mt-2 whitespace-pre-wrap">{inquiryDetail.question_text}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              送信先モデル
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={modelProfile}
                onChange={(event) => setModelProfile(event.target.value)}
              >
                {MODEL_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              オペレーター同意チェック
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                <span className="text-slate-600">個人情報マスキングを確認しました。</span>
              </div>
            </label>
          </div>
          <label className="text-sm">
            追加メモ
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <div>
            <p className="text-xs uppercase text-slate-500">マスキング結果（サンプル）</p>
            <p className="mt-2 rounded border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {maskedQuestion || "マスキング対象のデータはありません。"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {REPORT_PREVIEWS[inquiryDetail.inquiry_category as keyof typeof REPORT_PREVIEWS]?.map((section) => (
              <article key={`${section.title}-${section.page}`} className="rounded border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{section.title}</h4>
                  <span className="badge">Page {section.page}</span>
                </div>
                <p className="mt-2 text-slate-600">{section.text}</p>
              </article>
            )) ?? (
              <p className="text-sm text-slate-500">添付帳票プレビューは設定されていません。</p>
            )}
          </div>
        </section>
      )}

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">3. AI 回答案の生成</h3>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={disableGeneration || isPending}
            className="rounded bg-brand px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isPending ? "生成中..." : "AI 回答案を生成"}
          </button>
        </div>
        {!inquiryDetail && (
          <p className="text-sm text-slate-500">問い合わせを選択すると生成ボタンが有効になります。</p>
        )}

        {aiResponse && (
          <div className="space-y-4">
            <div className="rounded border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500">AIレスポンスID</p>
                  <p className="font-mono text-sm">{aiResponse.ai_response_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-slate-500">Confidence</p>
                  <p className="text-lg font-semibold">{(aiResponse.confidence_score * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-brand"
                  style={{ width: `${Math.min(aiResponse.confidence_score * 100, 100)}%` }}
                />
              </div>
            </div>

            <article className="space-y-3 rounded border border-slate-200 p-4">
              <header className="flex items-center justify-between">
                <h4 className="font-semibold">回答案</h4>
                <Link href={`/review?ai=${aiResponse.ai_response_id}`} className="text-sm text-brand underline">
                  レビュー画面で開く
                </Link>
              </header>
              <p className="whitespace-pre-wrap text-sm text-slate-800">{aiResponse.ai_answer_draft}</p>
            </article>

            <div>
              <h4 className="text-sm font-semibold">根拠</h4>
              <ul className="mt-2 space-y-2 text-sm">
                {aiResponse.evidence_refs.map((ref) => (
                  <li key={`${ref.source}-${ref.page}`} className="rounded border border-slate-200 p-3">
                    <p className="font-medium">{ref.source}</p>
                    <p className="text-xs text-slate-500">Page {ref.page ?? "-"} </p>
                    <p className="mt-1 text-slate-600">{ref.snippet}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">判定サポート (F-007)</p>
                  <p className="text-xs text-slate-500">自信度・編集量に基づきエスカレーション推奨を算出します。</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-xs uppercase text-slate-500">
                    オペレーター自信度
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={operatorConfidence}
                      onChange={(event) => setOperatorConfidence(Number(event.target.value))}
                      className="ml-2 align-middle"
                    />
                  </label>
                  <span className="w-12 text-right text-xs font-medium">{operatorConfidence.toFixed(2)}</span>
                </div>
                <button
                  type="button"
                  onClick={handleTriage}
                  className="rounded border border-brand px-4 py-2 text-sm text-brand"
                  disabled={isPending}
                >
                  判定を実行
                </button>
              </div>

              {triageResult && (
                <div
                  className={`mt-4 rounded-lg px-4 py-3 text-sm ${
                    triageResult.should_escalate
                      ? "bg-amber-50 text-amber-800"
                      : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <p className="font-semibold">
                    推奨: {triageResult.should_escalate ? "エスカレーション" : "オペレーター回答で可"}
                  </p>
                  <p className="mt-1">{triageResult.rationale}</p>
                  <p className="text-xs text-slate-500">
                    推奨チャネル: {triageResult.recommended_channel} / スコア {triageResult.confidence.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
