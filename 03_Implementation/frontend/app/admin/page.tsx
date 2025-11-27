'use client';

import { useEffect, useMemo, useState } from "react";

import { api } from "@/lib/apiClient";
import type { FinalResponseLog } from "@/lib/types";

export default function AdminPage() {
  const [logs, setLogs] = useState<FinalResponseLog[]>([]);
  const [channelFilter, setChannelFilter] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .listAuditLogs()
      .then(setLogs)
      .catch((error) => console.error(error));
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (channelFilter !== "all" && log.channel !== channelFilter) return false;
      if (!query) return true;
      const term = query.toLowerCase();
      return log.inquiry_id.toLowerCase().includes(term) || log.sender_id.toLowerCase().includes(term);
    });
  }, [logs, channelFilter, query]);

  const channelStats = useMemo(() => {
    return logs.reduce(
      (acc, log) => {
        acc[log.channel] = (acc[log.channel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [logs]);

  return (
    <main className="space-y-6">
      <header className="card space-y-1">
        <p className="text-xs font-semibold text-brand">AUD-001</p>
        <h2 className="text-xl font-semibold">最終回答ログ・監査ビュー</h2>
        <p className="text-sm text-slate-500">
          F-008/F-011 の送信履歴と監査メタを検索できます。フィルタでチャネルや問い合わせIDを絞り込み、監査DWH 連携前の状況を把握します。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {["email", "chat", "phone"].map((channel) => (
          <div key={channel} className="card space-y-2 text-sm">
            <p className="text-xs uppercase text-slate-500">{channel.toUpperCase()}</p>
            <p className="text-2xl font-semibold">{channelStats[channel] ?? 0}</p>
            <p className="text-xs text-slate-500">累計送信件数</p>
          </div>
        ))}
      </section>

      <section className="card space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm">
            チャネルフィルタ
            <select
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={channelFilter}
              onChange={(event) => setChannelFilter(event.target.value)}
            >
              <option value="all">すべて</option>
              <option value="email">email</option>
              <option value="chat">chat</option>
              <option value="phone">phone</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">
            問い合わせID / 送信者検索
            <input
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              placeholder="UUID または operator001"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="overflow-auto rounded border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-3 py-2">送信日時</th>
                <th className="px-3 py-2">問い合わせID</th>
                <th className="px-3 py-2">チャネル</th>
                <th className="px-3 py-2">送信者</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    条件に該当する監査ログがありません。
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.audit_log_id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">{new Date(log.sent_at).toLocaleString("ja-JP")}</td>
                    <td className="px-3 py-2 font-mono text-xs">{log.inquiry_id}</td>
                    <td className="px-3 py-2 uppercase">{log.channel}</td>
                    <td className="px-3 py-2">{log.sender_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
