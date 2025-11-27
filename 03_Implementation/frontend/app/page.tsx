import Link from "next/link";

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
  const inquiries = (await fetchJson<any[]>("/inquiries")) ?? [];

  return (
    <main className="space-y-6">
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
          {inquiries.length === 0 && <p className="text-slate-500">まだデータがありません。</p>}
          {inquiries.slice(0, 5).map((inq) => (
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
    </main>
  );
}
