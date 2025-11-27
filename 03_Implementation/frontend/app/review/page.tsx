'use client';

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import useSWR from "swr";

import { api, swrFetcher } from "@/lib/apiClient";
import type { AiResponseRead, AiResponseSummary, TriageResult } from "@/lib/types";

function calculateEditRatio(base: string, compared: string) {
  if (!base && !compared) return 0;
  if (!base || !compared) return 1;
  const rows = base.length + 1;
  const cols = compared.length + 1;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (base[i - 1] === compared[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }
  return Math.min(dp[rows - 1][cols - 1] / Math.max(base.length, compared.length), 1);
}

function extractMemo(edits: Record<string, unknown> | null | undefined): string {
  const memoField = (edits as { memo?: unknown } | null | undefined)?.memo;
  if (Array.isArray(memoField)) return memoField.join("\n");
  if (typeof memoField === "string") return memoField;
  return "";
}

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const initialAiId = searchParams.get("ai") ?? "";

  const [selectedResponseId, setSelectedResponseId] = useState(initialAiId);
  const [responseDetail, setResponseDetail] = useState<AiResponseRead | null>(null);
  const [draftAnswer, setDraftAnswer] = useState("");
  const [operatorMemo, setOperatorMemo] = useState("");
  const [operatorConfidence, setOperatorConfidence] = useState(0.7);
  const [status, setStatus] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data: responses, mutate } = useSWR<AiResponseSummary[]>("/ai/responses", swrFetcher);

  useEffect(() => {
    if (!selectedResponseId) {
      setResponseDetail(null);
      setDraftAnswer("");
      setOperatorMemo("");
      return;
    }
    setStatus(null);
    api
      .getAiResponse(selectedResponseId)
      .then((data) => {
        setResponseDetail(data);
        setDraftAnswer(data.ai_answer_draft);
        setOperatorMemo(extractMemo(data.operator_edits));
        setOperatorConfidence(Number(data.confidence_score) || 0.7);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "AIレスポンスを取得できません。";
        setStatus(message);
        setResponseDetail(null);
      });
  }, [selectedResponseId]);

  const diffRatio = useMemo(() => {
    if (!responseDetail) return 0;
    return calculateEditRatio(responseDetail.ai_answer_draft, draftAnswer);
  }, [responseDetail, draftAnswer]);

  function handleSave() {
    if (!selectedResponseId) return;
    startTransition(async () => {
      try {
        const updated = await api.reviewAiResponse(selectedResponseId, {
          ai_answer_draft: draftAnswer,
          operator_edits: {
            reviewer: "operator001",
            memo: operatorMemo || undefined
          },
          confidence_score: operatorConfidence
        });
        setResponseDetail(updated);
        setStatus("レビュー内容を保存しました。");
        mutate();
      } catch (error) {
        const message = error instanceof Error ? error.message : "保存に失敗しました。";
        setStatus(message);
      }
    });
  }

  function handleTriage() {
    if (!responseDetail) return;
    startTransition(async () => {
      try {
        const triage = await api.runTriage({
          inquiry_id: responseDetail.inquiry_id,
          ai_response_id: responseDetail.ai_response_id,
          edit_distance: diffRatio,
          operator_confidence: operatorConfidence
        });
        setTriageResult(triage);
      } catch (error) {
        const message = error instanceof Error ? error.message : "判定ロジックを呼び出せませんでした。";
        setStatus(message);
      }
    });
  }

  return (
    <main className="space-y-6">
      <header className="card space-y-1">
        <p className="text-xs font-semibold text-brand">AIN-002 / F-006</p>
        <h2 className="text-xl font-semibold">回答案レビュー＋バージョン管理</h2>
        <p className="text-sm text-slate-500">
          最新 10 件の AI 出力から選択し、差分編集・判定サポート・最終回答連携までを管理します（P-006〜P-008）。
        </p>
      </header>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold">1. AIレスポンス一覧</h3>
          <span className="text-xs text-slate-500">最新 {responses?.length ?? 0} 件</span>
        </div>
        <div className="overflow-auto rounded border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2">AIレスポンスID</th>
                <th className="px-3 py-2">問い合わせID</th>
                <th className="px-3 py-2">Version</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">作成日時</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {responses?.map((item) => (
                <tr
                  key={item.ai_response_id}
                  className={`cursor-pointer ${
                    selectedResponseId === item.ai_response_id ? "bg-brand-muted/40" : "hover:bg-slate-50"
                  }`}
                  onClick={() => setSelectedResponseId(item.ai_response_id)}
                >
                  <td className="px-3 py-2 font-mono text-xs">{item.ai_response_id}</td>
                  <td className="px-3 py-2 font-mono text-xs">{item.inquiry_id}</td>
                  <td className="px-3 py-2">{item.version_no}</td>
                  <td className="px-3 py-2">{(item.confidence_score * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{new Date(item.created_at).toLocaleString("ja-JP")}</td>
                </tr>
              )) ?? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                    AIレスポンスがまだありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {responseDetail ? (
        <section className="card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase text-slate-500">選択中のAIレスポンス</p>
              <p className="font-mono text-sm">{responseDetail.ai_response_id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-slate-500">Version</p>
              <p className="text-lg font-semibold">{responseDetail.version_no}</p>
            </div>
          </div>

          <label className="text-sm font-semibold">
            編集後の回答案
            <textarea
              className="mt-2 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={12}
              value={draftAnswer}
              onChange={(event) => setDraftAnswer(event.target.value)}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              オペレーターメモ
              <textarea
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                rows={5}
                value={operatorMemo}
                onChange={(event) => setOperatorMemo(event.target.value)}
                maxLength={1000}
              />
            </label>
            <div className="space-y-3 rounded border border-slate-200 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-slate-500">差分率（参考）</span>
                <span className="text-lg font-semibold">{(diffRatio * 100).toFixed(1)}%</span>
              </div>
              <p className="text-xs text-slate-500">
                文字レベルのレーベンシュタイン距離をもとに F-006 の差分プレビュー要件 (ITM-205) を簡易表示しています。
              </p>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase text-slate-500">オペレーター自信度</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={operatorConfidence}
                  onChange={(event) => setOperatorConfidence(Number(event.target.value))}
                />
                <span className="text-right text-xs font-medium">{operatorConfidence.toFixed(2)}</span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded bg-brand px-4 py-2 text-sm text-white disabled:opacity-60"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? "保存中..." : "レビュー内容を保存"}
            </button>
            <button
              type="button"
              className="rounded border border-brand px-4 py-2 text-sm text-brand"
              onClick={handleTriage}
              disabled={isPending}
            >
              判定サポートを実行
            </button>
            <Link
              href={`/escalations?inquiry=${responseDetail.inquiry_id}`}
              className="rounded border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:text-brand"
            >
              ESC-001（エスカレーション）へ
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded border border-slate-200 p-3 text-sm">
              <h4 className="font-semibold">根拠ビューア</h4>
              <ul className="mt-2 space-y-2">
                {responseDetail.evidence_refs.map((ref) => (
                  <li key={`${ref.source}-${ref.page}`} className="rounded border border-slate-100 p-3">
                    <p className="font-medium">{ref.source}</p>
                    <p className="text-xs text-slate-500">Page {ref.page ?? "-"}</p>
                    <p className="mt-1 text-slate-600">{ref.snippet}</p>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded border border-slate-200 p-3 text-sm">
              <h4 className="font-semibold">判定結果</h4>
              {triageResult ? (
                <div
                  className={`mt-2 rounded-lg px-4 py-3 ${
                    triageResult.should_escalate ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <p className="font-semibold">
                    {triageResult.should_escalate ? "エスカレーション推奨" : "即時回答可"}
                  </p>
                  <p className="text-sm">{triageResult.rationale}</p>
                  <p className="text-xs text-slate-500">
                    推奨チャネル: {triageResult.recommended_channel}（Score {triageResult.confidence.toFixed(2)}）
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-slate-500">判定結果はまだありません。保存後に実行してください。</p>
              )}
            </article>
          </div>
        </section>
      ) : (
        <section className="card text-sm text-slate-500">AIレスポンスを選択するとレビューを開始できます。</section>
      )}

      {status && (
        <p className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{status}</p>
      )}
    </main>
  );
}
