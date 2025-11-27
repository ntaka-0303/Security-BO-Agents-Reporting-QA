'use client';

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export default function AiPage() {
  const [inquiryId, setInquiryId] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiry_id: inquiryId })
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="card space-y-4">
      <div>
        <p className="text-xs font-semibold text-brand">AIN-001 / AIN-002</p>
        <h2 className="text-xl font-semibold">AI回答生成とレビュー</h2>
        <p className="text-sm text-slate-500">
          F-003〜F-006 の要件を PoC レベルで実装しています。
        </p>
      </div>
      <label className="block text-sm">
        問い合わせID
        <input
          value={inquiryId}
          onChange={(e) => setInquiryId(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 p-2"
          placeholder="UUID"
        />
      </label>
      <button
        className="rounded bg-brand px-4 py-2 text-white"
        onClick={generate}
        disabled={!inquiryId || loading}
      >
        {loading ? '生成中...' : 'AI 回答案を生成'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {result && (
        <div className="rounded border border-slate-200 p-4">
          <h3 className="font-semibold">回答案</h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{result.ai_answer_draft}</p>
          <h4 className="mt-4 text-sm font-semibold">根拠</h4>
          <ul className="list-disc pl-5 text-sm">
            {result.evidence_refs?.map((ref: any) => (
              <li key={`${ref.source}-${ref.page}`}>
                {ref.source} / {ref.page} / {ref.snippet}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
