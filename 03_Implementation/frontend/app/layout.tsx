import type { Metadata } from "next";
import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "CA Summary Control Tower",
  description: "CA通知の要約・レビュー・配信を一元管理する PoC UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              colorPrimary: "#1677ff",
              borderRadius: 8,
              fontSize: 14,
            },
          }}
        >
          <div className="app-shell">{children}</div>
        </ConfigProvider>
      </body>
    </html>
  );
}

