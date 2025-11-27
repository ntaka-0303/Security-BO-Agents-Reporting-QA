'use client';

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export default function EscalationPage() {
  const [inquiryId, setInquiryId] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function register() {
    try {
      const res = await fetch(`${API_BASE}/escalations/${inquiryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiry_id: inquiryId, escalation_reason: reason, escalation_flag: true })
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('バックオフィスに依頼しました');
    } catch (error: any) {
      setStatus(`エラー: ${error.message}`);
    }
  }

  return (
    <main className="card space-y-4">
      <div>
        <p className="text-xs font-semibold text-brand">ESC-001 / BO-001</p>
        <h2 className="text-xl font-semibold">エスカレーション管理</h2>
      </div>
      <label className="block text-sm">
        問い合わせID
        <input
          className="mt-1 w-full rounded border border-slate-300 p-2"
          value={inquiryId}
          onChange={(e) => setInquiryId(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        エスカレーション理由
        <textarea
          className="mt-1 w-full rounded border border-slate-300 p-2"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <button className="rounded bg-brand px-4 py-2 text-white" onClick={register} disabled={!inquiryId}>
        依頼を登録
      </button>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </main>
  );
}
