# Frontend (Next.js)

- App Router ベースで各画面 ID (INQ-001, AIN-001/002, OUT-001, ESC-001, BO-001, AUD-001) を再構成
- UI は Tailwind CSS を利用し、仕様書の主要入力項目・エラーフローを再現
- API は `NEXT_PUBLIC_API_BASE_URL` で FastAPI BFF (`/api`) に接続

## 開発フロー
```bash
npm install
npm run dev
```

## 主な画面
| 画面 | パス | 主な要件 |
| --- | --- | --- |
| INQ-001 | `/inquiries` | 問い合わせ起票 (F-001) |
| AIN-001/002 | `/ai` | 回答案生成・レビュー (F-003〜F-006) |
| OUT-001 | `/review` | 最終回答送信 (F-008) |
| ESC-001/BO-001 | `/escalations` | バックオフィス依頼 (F-009/F-010) |
| AUD-001 | `/admin` | 監査ログ閲覧 (F-011) |
```
