'use client';

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { ApiError, api } from "@/lib/apiClient";
import { BACKOFFICE_DEPARTMENTS, ESCALATION_REASON_CODES } from "@/lib/constants";
import type { EscalationRead } from "@/lib/types";

function defaultDueDate() {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date.toISOString().slice(0, 10);
}

export default function EscalationPage() {
  const searchParams = useSearchParams();
  const initialInquiry = searchParams.get("inquiry") ?? "";

  const [form, setForm] = useState({
    inquiryId: initialInquiry,
    reasonCode: ESCALATION_REASON_CODES[0].id,
    description: "",
    department: BACKOFFICE_DEPARTMENTS[0].id,
    assignedTo: "",
    dueDate: defaultDueDate(),
    comments: ""
  });
  const [status, setStatus] = useState<string | null>(null);
  const [existing, setExisting] = useState<EscalationRead | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!form.inquiryId) {
      setExisting(null);
      return;
    }
    api
      .getEscalation(form.inquiryId)
      .then((record) => setExisting(record))
      .catch((error: ApiError) => {
        if (error.status === 404) {
          setExisting(null);
          return;
        }
        setStatus(error.message);
      });
  }, [form.inquiryId]);

  const slaHours = useMemo(() => {
    if (!existing?.due_date) return null;
    const due = new Date(existing.due_date);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    return Math.max(Math.round(diff / (1000 * 60 * 60)), 0);
  }, [existing]);

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setStatus(null);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string[] {
    const errors: string[] = [];
    if (!form.inquiryId) errors.push("問い合わせIDは必須です。");
    if (!form.description.trim()) errors.push("理由の詳細を入力してください。");
    if (!form.reasonCode) errors.push("理由コードを選択してください。");
    const due = new Date(form.dueDate);
    const now = new Date();
    const max = new Date();
    max.setHours(max.getHours() + 24);
    if (due < now || due > max) errors.push("期日は24時間以内で設定してください。");
    return errors;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    if (errors.length > 0) {
      setStatus(errors.join(" / "));
      return;
    }
    startTransition(async () => {
      try {
        const payload = {
          inquiry_id: form.inquiryId,
          escalation_reason: `${form.reasonCode}:${form.description}`,
          escalation_flag: true,
          assigned_to: form.assignedTo || `${form.department}-queue`,
          due_date: form.dueDate
        };
        const record = await api.createEscalation(form.inquiryId, payload);
        setExisting(record);
        setStatus("エスカレーションを登録しました。");
      } catch (error) {
        const message = error instanceof Error ? error.message : "登録に失敗しました。";
        setStatus(message);
      }
    });
  }

  return (
    <main className="space-y-6">
      <header className="card space-y-1">
        <p className="text-xs font-semibold text-brand">ESC-001 / BO-001</p>
        <h2 className="text-xl font-semibold">エスカレーション管理</h2>
        <p className="text-sm text-slate-500">
          判定結果やオペ判断をもとにバックオフィスへ調査依頼を起票します。理由コード＋自由記述＋期日（24h以内）が必須です。
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="card space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              問い合わせID
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.inquiryId}
                onChange={(event) => update("inquiryId", event.target.value)}
                required
              />
            </label>
            <label className="text-sm">
              理由コード
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.reasonCode}
                onChange={(event) => update("reasonCode", event.target.value)}
              >
                {ESCALATION_REASON_CODES.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-sm">
            詳細説明（1000文字まで）
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={6}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={1000}
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm">
              担当部署
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.department}
                onChange={(event) => update("department", event.target.value)}
              >
                {BACKOFFICE_DEPARTMENTS.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              担当者（任意）
              <input
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.assignedTo}
                onChange={(event) => update("assignedTo", event.target.value)}
                placeholder="bo_user01"
              />
            </label>
            <label className="text-sm">
              期日（24h以内）
              <input
                type="date"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
                value={form.dueDate}
                onChange={(event) => update("dueDate", event.target.value)}
              />
            </label>
          </div>
          <label className="text-sm">
            追加コメント
            <textarea
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
              value={form.comments}
              onChange={(event) => update("comments", event.target.value)}
            />
          </label>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded bg-brand px-4 py-2 text-white disabled:opacity-60"
            disabled={isPending}
          >
            {isPending ? "送信中..." : "エスカレーション送信"}
          </button>
          {status && <span className="text-sm text-slate-600">{status}</span>}
        </div>
      </form>

      <section className="card space-y-4">
        <h3 className="text-lg font-semibold">進捗モニター</h3>
        {existing ? (
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <dl className="space-y-2">
              <div>
                <dt className="text-xs uppercase text-slate-500">ステータス</dt>
                <dd className="font-semibold uppercase">{existing.status}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">依頼日時</dt>
                <dd>{new Date(existing.created_at).toLocaleString("ja-JP")}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">担当者</dt>
                <dd>{existing.assigned_to ?? "未割当"}</dd>
              </div>
            </dl>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs uppercase text-slate-500">期日</dt>
                <dd>{existing.due_date ?? "未設定"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">残り時間 (目安)</dt>
                <dd>{slaHours !== null ? `${slaHours}h` : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-500">理由</dt>
                <dd>{existing.escalation_reason}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="text-sm text-slate-500">まだエスカレーションは登録されていません。</p>
        )}
      </section>
    </main>
  );
}
