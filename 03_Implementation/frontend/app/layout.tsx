import Link from "next/link";

import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Reporting QA Agent",
  description: "帳票問い合わせ対応のPoC UI"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl py-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">PoC Environment</p>
              <h1 className="text-2xl font-semibold">Reporting QA Agent</h1>
            </div>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="font-medium text-brand">
                ダッシュボード
              </Link>
              <Link href="/inquiries" className="text-slate-500 hover:text-brand">
                INQ-001
              </Link>
              <Link href="/ai" className="text-slate-500 hover:text-brand">
                AIN-001/002
              </Link>
              <Link href="/review" className="text-slate-500 hover:text-brand">
                OUT-001
              </Link>
              <Link href="/escalations" className="text-slate-500 hover:text-brand">
                ESC-001
              </Link>
              <Link href="/admin" className="text-slate-500 hover:text-brand">
                監査
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
