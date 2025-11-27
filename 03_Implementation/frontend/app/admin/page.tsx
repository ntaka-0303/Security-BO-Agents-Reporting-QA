async function fetchLogs() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/audits/logs`, {
      cache: "no-store"
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function AdminPage() {
  const logs = await fetchLogs();

  return (
    <main className="card">
      <div className="mb-4">
        <p className="text-xs font-semibold text-brand">AUD-001</p>
        <h2 className="text-xl font-semibold">最終回答ログ・監査</h2>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2">送信日時</th>
            <th>問い合わせID</th>
            <th>チャネル</th>
            <th>送信者</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-slate-500">
                まだ監査ログがありません。
              </td>
            </tr>
          )}
          {logs.map((log: any) => (
            <tr key={log.audit_log_id} className="border-t border-slate-100">
              <td className="py-2">{new Date(log.sent_at).toLocaleString("ja-JP")}</td>
              <td>{log.inquiry_id}</td>
              <td>{log.channel}</td>
              <td>{log.sender_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
