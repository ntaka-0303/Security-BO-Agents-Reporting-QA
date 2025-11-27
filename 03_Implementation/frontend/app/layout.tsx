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
              <a href="/" className="font-medium text-brand">
                ダッシュボード
              </a>
              <a href="/inquiries" className="text-slate-500 hover:text-brand">
                INQ-001
              </a>
              <a href="/ai" className="text-slate-500 hover:text-brand">
                AIN-001/002
              </a>
              <a href="/review" className="text-slate-500 hover:text-brand">
                OUT-001
              </a>
              <a href="/escalations" className="text-slate-500 hover:text-brand">
                ESC-001
              </a>
              <a href="/admin" className="text-slate-500 hover:text-brand">
                監査
              </a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
