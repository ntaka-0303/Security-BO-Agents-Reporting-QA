import Link from "next/link";

import type { AiResponseSummary, FinalResponseLog, InquirySummary } from "@/lib/types";

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";
    const res = await fetch(`${base}${path}`, {
      cache: "no-store"
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (error) {
    console.error("Failed to load", error);
    return null;
  }
}

export default async function DashboardPage() {
  const [inquiries, aiResponses, auditLogs] = await Promise.all([
    fetchJson<InquirySummary[]>("/inquiries"),
    fetchJson<AiResponseSummary[]>("/ai/responses"),
    fetchJson<FinalResponseLog[]>("/audits/logs")
  ]);

  const inquiryList = inquiries ?? [];
  const aiList = aiResponses ?? [];
  const auditList = auditLogs ?? [];

  const recentInquiries = inquiryList.filter((inq) => {
    const created = new Date(inq.created_at);
    return Date.now() - created.getTime() < 1000 * 60 * 60 * 24;
  });

  return (
    <main className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "過去24hの問い合わせ", value: recentInquiries.length, href: "/inquiries" },
          { label: "AI回答案（最新）", value: aiList.length, href: "/ai" },
          { label: "監査ログ", value: auditList.length, href: "/admin" }
        ].map((card) => (
          <Link key={card.label} href={card.href} className="card block space-y-2 rounded-xl border border-slate-200">
            <p className="text-xs uppercase text-slate-500">{card.label}</p>
            <p className="text-3xl font-semibold">{card.value}</p>
            <p className="text-xs text-slate-400">詳細を見る</p>
          </Link>
        ))}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">主要フロー</h2>
        <p className="text-sm text-slate-500">
          P-001〜P-011 を通しで確認できます。各カードから対象画面に遷移してください。
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { id: "INQ-001", title: "問い合わせ受付", href: "/inquiries" },
            { id: "AIN-001", title: "AI回答生成", href: "/ai" },
            { id: "OUT-001", title: "回答レビュー/送信", href: "/review" },
            { id: "ESC-001", title: "エスカレーション", href: "/escalations" },
            { id: "BO-001", title: "バックオフィス応答", href: "/escalations" },
            { id: "AUD-001", title: "最終回答ログ", href: "/admin" }
          ].map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-semibold text-brand">{item.id}</p>
              <p className="text-base font-medium">{item.title}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近の問い合わせ</h2>
          <Link href="/inquiries" className="text-sm text-brand">
            全件を見る
          </Link>
        </div>
        <div className="mt-4 divide-y text-sm">
          {inquiryList.length === 0 && <p className="text-slate-500">まだデータがありません。</p>}
          {inquiryList.slice(0, 5).map((inq) => (
            <div key={inq.inquiry_id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{inq.inquiry_category}</p>
                <p className="text-xs text-slate-500">{inq.inquiry_id}</p>
              </div>
              <span className="badge">{new Date(inq.created_at).toLocaleString("ja-JP")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">最新のAI回答案</h2>
          <Link href="/ai" className="text-sm text-brand">
            AIN-001を開く
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
          {aiList.slice(0, 4).map((resp: any) => (
            <article key={resp.ai_response_id} className="rounded border border-slate-200 p-3">
              <p className="text-xs uppercase text-slate-500">AIレスポンスID</p>
              <p className="font-mono text-xs">{resp.ai_response_id}</p>
              <p className="mt-2 text-xs text-slate-500">Version {resp.version_no}</p>
              <p className="text-xs text-slate-500">Confidence {(resp.confidence_score * 100).toFixed(1)}%</p>
            </article>
          ))}
          {aiList.length === 0 && <p className="text-sm text-slate-500">AI回答案はまだ生成されていません。</p>}
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">監査ログ（最新5件）</h2>
          <Link href="/admin" className="text-sm text-brand">
            AUD-001へ
          </Link>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-2 py-2">送信日時</th>
                <th className="px-2 py-2">問い合わせID</th>
                <th className="px-2 py-2">チャネル</th>
                <th className="px-2 py-2">送信者</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditList.slice(0, 5).map((log: any) => (
                <tr key={log.audit_log_id}>
                  <td className="px-2 py-2">{new Date(log.sent_at).toLocaleString("ja-JP")}</td>
                  <td className="px-2 py-2 font-mono text-xs">{log.inquiry_id}</td>
                  <td className="px-2 py-2 uppercase">{log.channel}</td>
                  <td className="px-2 py-2">{log.sender_id}</td>
                </tr>
              ))}
              {auditList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-slate-500">
                    送信ログはまだありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
