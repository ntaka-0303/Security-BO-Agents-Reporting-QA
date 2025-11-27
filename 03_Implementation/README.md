# Reporting QA Agent PoC (Reimplemented)

本ディレクトリは、要求定義書（01）、業務要件定義書（02）、各機能仕様書（F-001〜F-011）に準拠して再構築した PoC 実装です。Docker Compose で Next.js ベースのフロントエンドと FastAPI + Celery ベースのバックエンド／ワーカー群を起動し、帳票問い合わせ受付から最終回答ログ監査までのエンドツーエンド体験を再現します。

## 構成概要

- `backend/`
  - FastAPI（REST BFF）
  - SQLAlchemy + PostgreSQL スキーマ（05_テーブル定義の D-001〜D-014 を完全表現）
  - Celery + Redis による帳票解析・LLM 推論ジョブ
  - LangChain ベースの AI パイプラインと危険語フィルタ
- `frontend/`
  - Next.js (App Router) + TypeScript + Tailwind CSS
  - 画面 ID：INQ-001 / AIN-001 / AIN-002 / OUT-001 / ESC-001 / BO-001
  - SWR + fetch で BFF API と連携し、各仕様書の入力・バリデーション・エラーハンドリングを再現
- `docs/`
  - アーキテクチャ差分、API 一覧、ER 図要約
- `prompts/`
  - ベースプロンプト、危険語辞書（F-005 のフィルタリングに利用）
- `docker-compose.yml`
  - `frontend` / `backend` / `worker` / `postgres` / `redis` / `vectorstore`（Chroma）

## 起動手順（概要）

```bash
# 1. 依存をインストール
cd backend && uv sync
cd ../frontend && npm install

# 2. ルートに戻り、Docker Compose を起動
cd ..
docker compose up --build
```

## 主なユースケース対応

| 業務番号 | API / 画面 | 説明 |
| --- | --- | --- |
| P-001〜P-003 | `/api/inquiries`, INQ-001 | 問い合わせチケット起票と帳票メタ取込 |
| P-004〜P-005 | `/api/ai/responses`, AIN-001/002 | 帳票解析 → LLM 回答案生成、根拠抽出 |
| P-006〜P-007 | `/api/responses/review`, `/api/workflows/triage`, AIN-002 | オペレーター編集と自動判定 |
| P-008 | `/api/responses/finalize`, OUT-001 | 顧客向け最終回答作成・送信ジョブ登録 |
| P-009〜P-010 | `/api/escalations`, ESC-001 / BO-001 | バックオフィス連携管理 |
| P-011 | `/api/audit/logs`, 監査ビュー | 最終回答ログ監査・エクスポート |

詳細は `docs/ARCHITECTURE.md` および各ディレクトリ内 README を参照してください。
