import type { Metadata } from "next";
import "antd/dist/reset.css";
import "./globals.css";
import { AntdProvider } from "./providers";

export const metadata: Metadata = {
  title: "CA Summary Control Tower",
  description: "CA通知の要約・レビュー・配信を一元管理する PoC UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AntdProvider>
          <div className="app-shell">{children}</div>
        </AntdProvider>
      </body>
    </html>
  );
}

