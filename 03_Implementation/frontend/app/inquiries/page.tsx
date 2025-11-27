'use client';

import { useState, useTransition } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export default function InquiryPage() {
  const [form, setForm] = useState({
    customer_id: "",
    inquiry_category: "特定口座年間取引報告書",
    question_text: "",
    created_by: "operator001"
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`${API_BASE}/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, customer_attributes: { channel: 'call' } })
        });
        if (!res.ok) throw new Error(await res.text());
        setMessage('問い合わせを登録しました');
        setForm({ ...form, question_text: '' });
      } catch (error: any) {
        setMessage(`エラー: ${error.message}`);
      }
    });
  }

  return (
    <main className="card space-y-4">
      <div>
        <p className="text-xs font-semibold text-brand">INQ-001</p>
        <h2 className="text-xl font-semibold">問い合わせ受付フォーム</h2>
        <p className="text-sm text-slate-500">P-001〜P-003 に対応。</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm">
          顧客ID
          <input
            value={form.customer_id}
            onChange={(e) => update('customer_id', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 p-2"
            required
          />
        </label>
        <label className="block text-sm">
          帳票種別
          <select
            value={form.inquiry_category}
            onChange={(e) => update('inquiry_category', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 p-2"
          >
            <option value="特定口座年間取引報告書">特定口座年間取引報告書</option>
            <option value="取引報告書">取引報告書</option>
            <option value="残高報告書">残高報告書</option>
          </select>
        </label>
        <label className="block text-sm">
          質問内容
          <textarea
            value={form.question_text}
            onChange={(e) => update('question_text', e.target.value)}
            className="mt-1 w-full rounded border border-slate-300 p-2"
            rows={4}
            required
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-brand px-4 py-2 text-white"
        >
          {isPending ? '送信中...' : '問い合わせ登録'}
        </button>
      </form>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </main>
  );
}
