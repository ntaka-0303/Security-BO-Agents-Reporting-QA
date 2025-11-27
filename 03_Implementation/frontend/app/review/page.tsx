'use client';

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export default function ReviewPage() {
  const [aiResponseId, setAiResponseId] = useState("");
  const [inquiryId, setInquiryId] = useState("");
  const [draft, setDraft] = useState("");
  const [finalText, setFinalText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function saveReview() {
    try {
      const res = await fetch(`${API_BASE}/ai/responses/${aiResponseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_answer_draft: draft, operator_edits: { reviewer: 'operator001' } })
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('AI回答案のレビューを保存しました');
    } catch (error: any) {
      setStatus(`エラー: ${error.message}`);
    }
  }

  async function finalize() {
    try {
      const res = await fetch(`${API_BASE}/responses/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          final_response_text: finalText,
          channel: 'email',
          sender_id: 'operator001'
        })
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('最終回答を送信しました');
    } catch (error: any) {
      setStatus(`エラー: ${error.message}`);
    }
  }

  return (
    <main className="card space-y-4">
      <div>
        <p className="text-xs font-semibold text-brand">OUT-001</p>
        <h2 className="text-xl font-semibold">回答レビューと最終送信</h2>
      </div>
      <label className="block text-sm">
        AIレスポンスID
        <input
          className="mt-1 w-full rounded border border-slate-300 p-2"
          value={aiResponseId}
          onChange={(e) => setAiResponseId(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        問い合わせID
        <input
          className="mt-1 w-full rounded border border-slate-300 p-2"
          value={inquiryId}
          onChange={(e) => setInquiryId(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        編集後の回答案
        <textarea
          className="mt-1 w-full rounded border border-slate-300 p-2"
          rows={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      </label>
      <button className="rounded bg-brand px-4 py-2 text-white" onClick={saveReview} disabled={!aiResponseId}>
        レビュー内容を保存
      </button>
      <label className="block text-sm">
        顧客向け最終回答
        <textarea
          className="mt-1 w-full rounded border border-slate-300 p-2"
          rows={5}
          value={finalText}
          onChange={(e) => setFinalText(e.target.value)}
        />
      </label>
      <button className="rounded border border-brand px-4 py-2 text-brand" onClick={finalize} disabled={!finalText || !inquiryId}>
        最終回答を送信
      </button>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </main>
  );
}
