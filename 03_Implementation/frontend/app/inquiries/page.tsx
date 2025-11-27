'use client';

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { api } from "@/lib/apiClient";
import {
  CUSTOMER_DIRECTORY,
  CUSTOMER_TAGS,
  INQUIRY_CATEGORIES,
  REPORT_PREVIEWS,
  defaultScheduledAt
} from "@/lib/constants";
import type { InquiryRead } from "@/lib/types";

type AttachmentDraft = {
  id: string;
  file: File;
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_TAG_COUNT = 5;

export default function InquiryPage() {
  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    inquiryCategory: INQUIRY_CATEGORIES[0],
    questionText: "",
    createdBy: "operator001",
    tags: [] as string[],
    channel: "call",
    aiEnabled: true,
    reportId: "",
    scheduleAt: defaultScheduledAt(),
    notes: ""
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [crmMessage, setCrmMessage] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [createdInquiry, setCreatedInquiry] = useState<InquiryRead | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTag(tag: string) {
    setForm((prev) => {
      const exists = prev.tags.includes(tag);
      if (exists) {
        return { ...prev, tags: prev.tags.filter((t) => t !== tag) };
      }
      if (prev.tags.length >= MAX_TAG_COUNT) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
  }

  async function handleCrmLookup() {
    setCrmMessage(null);
    const term = searchTerm.trim();
    if (!term) {
      setCrmMessage("検索キーワードを入力してください。");
      return;
    }
    const match = CUSTOMER_DIRECTORY.find(
      (entry) => entry.customer_id === term || entry.name.includes(term)
    );
    if (!match) {
      setCrmMessage("該当する顧客が見つかりませんでした。");
      return;
    }
    setForm((prev) => ({
      ...prev,
      customerId: match.customer_id,
      customerName: match.name,
      channel: match.preferred_channel,
      tags: Array.from(new Set([...prev.tags, ...match.attributes])).slice(0, MAX_TAG_COUNT)
    }));
    setCrmMessage(`${match.name}（${match.customer_id}）の属性を読み込みました。`);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;
    const newDrafts: AttachmentDraft[] = [];
    for (const file of Array.from(files)) {
      if (file.type !== "application/pdf") {
        setFeedback({ type: "error", message: "PDF以外のファイルはアップロードできません。" });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFeedback({ type: "error", message: "25MBを超えるファイルは登録できません。" });
        continue;
      }
      const generatedId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
      newDrafts.push({ id: generatedId, file });
    }
    setAttachments((prev) => [...prev, ...newDrafts].slice(0, 3));
    event.target.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }

  const aiRequirementSatisfied = useMemo(() => {
    if (!form.aiEnabled) return true;
    return attachments.length > 0 || form.reportId.trim().length > 0;
  }, [attachments.length, form.aiEnabled, form.reportId]);

  function buildValidationErrors() {
    const errors: string[] = [];
    if (!form.customerId || !form.customerName) errors.push("顧客ID/氏名は必須です。");
    if (!form.questionText.trim()) errors.push("問い合わせ内容を入力してください。");
    if (!aiRequirementSatisfied) errors.push("AI連携ON時は帳票添付または帳票IDが必須です。");
    if (form.aiEnabled) {
      const schedule = new Date(form.scheduleAt);
      const minSchedule = new Date();
      minSchedule.setMinutes(minSchedule.getMinutes() + 5);
      if (schedule < minSchedule) {
        errors.push("送信予約は現在時刻+5分以降で設定してください。");
      }
    }
    return errors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = buildValidationErrors();
    if (errors.length > 0) {
      setFeedback({ type: "error", message: errors.join(" / ") });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      try {
        const inquiry = await api.createInquiry({
          customer_id: form.customerId,
          inquiry_category: form.inquiryCategory,
          question_text: form.questionText,
          created_by: form.createdBy,
          ai_enabled: form.aiEnabled,
          customer_attributes: {
            customer_name: form.customerName,
            tags: form.tags,
            preferred_channel: form.channel,
            ai_schedule_at: form.scheduleAt,
            notes: form.notes,
            report_id: form.reportId || undefined
          }
        });

        if (form.aiEnabled && attachments.length > 0) {
          await Promise.all(
            attachments.map((item, index) =>
              api.ingestDocument({
                inquiry_id: inquiry.inquiry_id,
                report_type: form.inquiryCategory,
                report_file_uri: `uploaded://${encodeURIComponent(item.file.name)}`,
                report_structured_json: {
                  title: item.file.name,
                  page_count: 1,
                  summary: form.questionText.slice(0, 160),
                  sequence: index + 1
                }
              })
            )
          );
        }

        setFeedback({
          type: "success",
          message: `問い合わせID ${inquiry.inquiry_id} を登録しました。`
        });
        setCreatedInquiry(inquiry);
        setAttachments([]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "登録に失敗しました";
        setFeedback({ type: "error", message });
      }
    });
  }

  return (
    <main className="space-y-6">
      <header className="card space-y-1">
        <p className="text-xs font-semibold text-brand">INQ-001</p>
        <h2 className="text-xl font-semibold">問い合わせ受付＋AI連携設定</h2>
        <p className="text-sm text-slate-500">
          CRM 検索・AI連携フラグ・添付検証を含む F-001 の主要フローを再現しています。
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card space-y-4">
          <h3 className="text-lg font-semibold">顧客検索</h3>
          <div className="grid gap-4 md:grid-cols-[2fr,auto]">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="顧客ID または 氏名"
                className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleCrmLookup}
                className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
              >
                CRM検索
              </button>
            </div>
            <div className="text-xs text-slate-500">
              CRM (S-001) から顧客属性タグを取得し、AI連携の必須条件を確認します。
            </div>
          </div>
          {crmMessage && <p className="text-sm text-slate-600">{crmMessage}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              顧客ID
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.customerId}
                onChange={(event) => update("customerId", event.target.value)}
                maxLength={20}
                required
              />
            </label>
            <label className="text-sm">
              顧客氏名
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.customerName}
                onChange={(event) => update("customerName", event.target.value)}
                maxLength={50}
                required
              />
            </label>
          </div>
          <label className="text-sm">
            顧客属性タグ（最大5件）
            <div className="mt-2 flex flex-wrap gap-2">
              {CUSTOMER_TAGS.map((tag) => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      active
                        ? "bg-brand text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </label>
        </section>

        <section className="card space-y-4">
          <h3 className="text-lg font-semibold">問い合わせ基本情報</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              帳票種別
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.inquiryCategory}
                onChange={(event) => update("inquiryCategory", event.target.value)}
              >
                {INQUIRY_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              連絡チャネル
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.channel}
                onChange={(event) => update("channel", event.target.value)}
              >
                <option value="call">電話</option>
                <option value="email">メール</option>
                <option value="chat">チャット</option>
              </select>
            </label>
          </div>
          <label className="text-sm">
            質問内容
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={5}
              value={form.questionText}
              onChange={(event) => update("questionText", event.target.value)}
              maxLength={2000}
              required
            />
            <span className="mt-1 block text-right text-xs text-slate-400">
              {form.questionText.length} / 2000
            </span>
          </label>
          <label className="text-sm">
            内部メモ
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              maxLength={1000}
            />
          </label>
        </section>

        <section className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">AI連携設定</h3>
              <p className="text-sm text-slate-500">
                AI連携ON時は帳票添付または帳票IDのいずれかが必須です（ERR-003 対応）。
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.aiEnabled}
                onChange={(event) => update("aiEnabled", event.target.checked)}
              />
              AI連携を利用する
            </label>
          </div>

          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              aiRequirementSatisfied
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {aiRequirementSatisfied
              ? "帳票添付／帳票IDの要件を満たしています。"
              : "AI連携ON時は帳票添付または帳票IDを指定してください。"}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              帳票添付（PDF・25MB以下）
              <input
                type="file"
                accept="application/pdf"
                className="mt-2 block w-full text-sm text-slate-600"
                onChange={handleFileChange}
                disabled={!form.aiEnabled}
              />
            </label>
            <label className="text-sm">
              帳票ID
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.reportId}
                onChange={(event) => update("reportId", event.target.value)}
                placeholder="RPT-2025-0001"
                disabled={!form.aiEnabled}
              />
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="rounded border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold">
                添付済み帳票
              </div>
              <ul className="divide-y text-sm">
                {attachments.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-4 py-2">
                    <div>
                      <p className="font-medium">{item.file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-brand"
                      onClick={() => removeAttachment(item.id)}
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label className="text-sm">
            AI連携送信予約（最短+5分、24h以内）
            <input
              type="datetime-local"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
              value={form.scheduleAt}
              min={defaultScheduledAt()}
              max={(() => {
                const d = new Date();
                d.setHours(d.getHours() + 24);
                return d.toISOString().slice(0, 16);
              })()}
              onChange={(event) => update("scheduleAt", event.target.value)}
              disabled={!form.aiEnabled}
            />
          </label>
        </section>

        <section className="card space-y-4">
          <h3 className="text-lg font-semibold">帳票プレビュー（サンプル）</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {REPORT_PREVIEWS[form.inquiryCategory]?.map((section) => (
              <article key={section.title} className="rounded border border-slate-200 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{section.title}</h4>
                  <span className="badge">Page {section.page}</span>
                </div>
                <p className="mt-2 text-slate-600">{section.text}</p>
              </article>
            )) ?? <p className="text-sm text-slate-500">帳票プレビューはありません。</p>}
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            ERR-001 / ERR-003 / ERR-010 対応のため、必須入力と連携可否を同時に検証します。
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-brand px-6 py-2 text-white disabled:opacity-60"
          >
            {isPending ? "登録中..." : "問い合わせを登録"}
          </button>
        </div>
      </form>

      {feedback && (
        <p
          className={`rounded border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.message}
        </p>
      )}

      {createdInquiry && (
        <section className="card space-y-3 text-sm">
          <h3 className="text-lg font-semibold">登録結果</h3>
          <dl className="grid gap-2 md:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-slate-500">問い合わせID</dt>
              <dd className="font-medium">{createdInquiry.inquiry_id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">顧客ID</dt>
              <dd className="font-medium">{createdInquiry.customer_id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">登録日時</dt>
              <dd>{new Date(createdInquiry.created_at).toLocaleString("ja-JP")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">AI連携</dt>
              <dd>{createdInquiry.ai_enabled ? "ON" : "OFF"}</dd>
            </div>
          </dl>
          <p className="text-xs text-slate-500">
            次のステップ:{" "}
            <Link href={`/ai?inquiry=${createdInquiry.inquiry_id}`} className="text-brand underline">
              AIN-001 に遷移して AI 回答案を生成
            </Link>
          </p>
        </section>
      )}
    </main>
  );
}
