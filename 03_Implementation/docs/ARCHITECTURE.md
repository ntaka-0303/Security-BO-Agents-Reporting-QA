# Architecture Overview

このドキュメントは、PoC 実装の技術構成とデータフローを要件定義書／仕様書との対応で説明します。

## 1. システム構成

```
┌──────────┐      ┌────────────┐      ┌─────────────┐
│  Next.js   │ REST │   FastAPI   │ SQL  │  PostgreSQL │
│ (frontend) │◀────▶│  (backend)  │◀────▶│    +pgvector │
└──────────┘      └─────┬──────┘      └─────────────┘
        ▲                 │  ▲
        │                 │  │  Celery タスク
        │                 │  └─────────────┐
        │                 │                │
        │              Redis Queue         │
        │                 │                │
        ▼                 ▼                ▼
    Operator UI     Worker (LLM)      Vector Store
```

- フロントエンド：Next.js (App Router) + Tailwind CSS + SWR。画面仕様（F-001〜F-011）の各 UI Flow を実装。
- バックエンド：FastAPI + SQLAlchemy。`/api` 配下に BFF API を用意し、pydantic で I/O スキーマを厳密化。
- ワーカー：Celery + Redis。帳票解析、チャンク埋め込み、LLM 呼び出し、最終回答送信／監査エクスポートを実行。
- ベースモデル：05_テーブル定義の `inquiry`, `report_meta`, `ai_response`, `escalation`, `final_response_log` をそのまま ORM 化。

## 2. 主要データフロー

1. **問い合わせ受付 (F-001)**
   - `POST /api/inquiries` が CRM チケット相当のレコードを生成。
   - 帳票メタ（F-002）は `POST /api/documents` で格納し、RAG 用チャンクを Worker にキューイング。
2. **AI 回答案生成 (F-003〜F-005)**
   - `POST /api/ai/responses` が Celery タスク `tasks.generate_ai_response` を起動。
   - LangChain が `prompts/base_prompt.md` と危険語フィルタを適用し、回答案＋根拠を生成。
3. **レビュー／判定 (F-006〜F-007)**
   - オペレーターは `PATCH /api/responses/{id}` で編集を保存。
   - 判定 API `POST /api/workflows/triage` が信頼度・編集量からエスカレーション推奨を返却。
4. **エスカレーション (F-009〜F-010)**
   - `POST /api/escalations` でバックオフィス依頼を登録し、BO 画面（ESC-001/BO-001）が進捗を更新。
5. **顧客回答・監査 (F-008, F-011)**
   - `POST /api/responses/finalize` が最終回答を確定し、送信チャネルを Celery が模擬送信。
   - 送信完了で `final_response_log` を生成し、監査エンドポイントから検索／エクスポートが可能。

## 3. ディレクトリ対応

| ディレクトリ | 役割 | 主な仕様対応 |
| --- | --- | --- |
| `backend/app/models` | ORM モデル | 05_テーブル定義 D-001〜D-014 |
| `backend/app/schemas` | I/O スキーマ | 各機能仕様書 F-001〜F-011 |
| `backend/app/services` | ドメインサービス | 帳票解析、AI 連携、判定、監査 |
| `backend/app/routers` | REST API | プロセス P-001〜P-011 |
| `backend/app/workflows` | ルールエンジン | F-007 判定サポート |
| `backend/app/workers` | Celery タスク | F-004/005/008/011 バックグラウンド処理 |
| `frontend/app/*` | UI フロー | INQ-001, AIN-001, AIN-002, OUT-001, ESC-001, BO-001 |

## 4. 非機能要件

- **ログ／監査**：FastAPI ミドルウェアで JSON 監査ログを構成。`final_response_log` に WORM 連携用のメタを保持。
- **エラーハンドリング**：仕様書のエラーコード（`AI-001`, `DOC-002` など）を `app/services/errors.py` に定義し、UI と連携。
- **拡張性**：RAG ベクトル DB は default で内蔵 Chroma、`.env` により pgvector へ切替可能。

これらにより、旧実装から要件との乖離を排除し、文書化されたプロセス／データ構造とコードが 1 対 1 で追跡できるようになっています。
