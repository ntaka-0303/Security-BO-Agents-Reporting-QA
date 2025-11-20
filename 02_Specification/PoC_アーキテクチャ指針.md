# Reporting QA エージェント PoC アーキテクチャ指針

## 1. 方針概要
- 帳票問い合わせ対応のエンドツーエンド体験（F-001〜F-011）を PoC 期間内に実証するため、CA Summary PoC と同様に Docker Compose ベースの一体環境で構築する。
- 認証・権限は PoC スコープ外とし、オペレーター/バックオフィス/監査の画面はロール切替メニューのみで擬似的に表現する。
- LLM＋RAG 連携、帳票解析、エスカレーション、最終回答ログを最小構成で繋ぎ、仕様書との整合（テンプレ項目・エラー・データ定義）を FastAPI/pydantic で担保する。

## 2. 技術スタックと役割
| レイヤ | 技術 | 役割 |
| --- | --- | --- |
| フロントエンド | Next.js (App Router) + TypeScript + Tailwind CSS | INQ-001/AIN-001/AIN-002/OUT-001/ESC-001/BO-001 など UI を実装。SWR + fetch で BFF と通信し、画面仕様をそのまま反映。 |
| バックエンド | FastAPI (Python) + Pydantic | 問い合わせ管理、帳票取得連携、回答生成、判定・エスカレーション API を提供。仕様書の処理フロー／I/O をスキーマとして定義。 |
| AI 連携 | LangChain + OpenAI 互換 API | F-003〜F-005 のジョブ生成と LLM 推論を実行。プロンプト・危険語フィルタ・根拠整形を Python サービス層で制御。 |
| 帳票解析 | pdfplumber / BeautifulSoup + 独自ロジック | F-004 の PDF/HTML 解析とテキストチャンク生成、Vector DB への登録を行う。 |
| ベクトルDB | pgvector (PostgreSQL 拡張) または Chroma | F-004/F-005 の RAG 用チャンク検索を PoC 範囲で実現。 |
| DB | PostgreSQL | `inquiry`, `report_meta`, `ai_request`, `ai_response`, `escalation`, `final_response_log` 等、05_テーブル定義準拠のスキーマを管理。 |
| 非同期処理 | Celery + Redis | 帳票解析ジョブ、LLM 推論、送信再試行、監査転送をバックグラウンドで実行。 |
| インフラ | Docker Compose | `frontend`/`backend`/`worker`/`db`/`redis`/`vector-store` を一括起動し PoC 環境を再現。 |

## 3. 構成イメージ
```
┌──────────┐        ┌─────────┐        ┌────────────┐
│ Frontend │─REST→│ FastAPI │─SQL→│ PostgreSQL │
└──────────┘        │  (BFF)  │        └────────────┘
        │            │   │  │
        │            │   │  ├─LLM API（LangChain 経由）
        │            │   │  ├─帳票解析/Embedding Worker（Celery + Redis）
        │            │   └─▶Vector Store (pgvector/Chroma)
        │            └──Webhook/送信API（メール/チャット mock）
```

## 4. 仕様との対応
- **F-001/F-003/F-006/F-008/F-009/F-010**：Next.js で各画面 ID（INQ-001, AIN-001, AIN-002, OUT-001, ESC-001, BO-001）を実装し、テンプレの項目・アクション・エラーをそのまま組み込む。
- **F-002/F-004/F-005/F-007/F-011**：FastAPI サービス層で帳票取得、解析ジョブ、回答案生成、判定ロジック、監査ログを実装。pydantic モデルで `05_テーブル定義_reporting_QA_agent.md` の D-001〜D-014 を表現。
- **データ構造**：PostgreSQL に 05 テーブル定義書の schema を再現し、`ai_request`/`ai_response`/`report_meta`/`escalation`/`final_response_log` を Alembic で管理。JSONB カラムに根拠や編集履歴を格納。
- **判定サポート (F-007)**：FastAPI 内のルールエンジン（設定ファイル JSON）で自信度・編集量を算出し、結果を `escalation_suggestion` に保存して UI に反映。
- **最終回答＆監査 (F-008/F-011)**：送信処理は REST Mock（メール/チャット GW）で代替し、Celery タスクで再送・監査 DWH 連携を PoC 水準で再現。
- **監査ログ**：FastAPI ミドルウェアで API 呼び出しを捕捉し、最終回答ログや判定結果を `final_response_log`/`audit_export_history` に記録。将来の WORM 連携へ差し替え可能な構成とする。

## 5. 実装ステップ案
1. Docker Compose で Next.js / FastAPI / PostgreSQL / Redis / Celery Worker / pgvector の骨格を作成。
2. FastAPI に DB モデル・pydantic スキーマを実装し、仕様書の API 入出力・エラーコードをそのまま表現。Alembic でマイグレーションを管理。
3. Next.js で INQ-001/AIN-001/AIN-002/OUT-001/ESC-001/BO-001 のワイヤーフレームを Tailwind で再現し、仕様書の入力制御・バリデーション・エラーメッセージを実装。
4. LangChain + OpenAI 互換 API で F-003/F-005 のプロンプト・推論・根拠整形を実装し、自信度算出と危険語フィルタをサービス層に組み込み。
5. Celery タスクで帳票解析（F-004）、回答案生成（F-005）、送信再試行/監査転送（F-008/F-011）を非同期処理化。Redis をジョブキュー、pgvector をチャンク検索に利用。
6. 判定サポート・エスカレーション・バックオフィス返送など横断機能を結合し、仕様書ベースのシナリオテスト（P-001〜P-011）を実施。

## 6. 特記事項
- 認証／SSO は PoC スコープ外。HTTP ヘッダの疑似トークンでロールを切り替え、本番化時に ID プロバイダを差し込める構造を確保。
- 帳票ファイルは疑似ストレージ（ローカル or MinIO）に保存し、署名付き URL を FastAPI で発行。マスキングルールはクライアント/サーバ双方で冗長化する。
- LLM API は社内規定に合わせて OpenAI 互換エンドポイントまたは社内ホスティングモデルを設定ファイルで切替。危険語リストは `prompts/danger_words.txt` を共通利用。
- モニタリングは docker logs + Celery/Redis のヘルスチェック程度に留め、PoC 中は手動で監視。必要に応じて簡易メトリクスエンドポイントを FastAPI に追加。

## 7. 期待効果
- CA Summary PoC と同様のスタックに統一することで、開発チームの再利用性と学習コスト削減を実現。
- Frontend/Backend/Worker が同一 Compose 環境で動作するため、帳票取得→AI生成→判定→送信→監査までの複雑フローを短期間で検証可能。
- 仕様書・データ定義との整合を pydantic/Alembic で担保し、PoC 段階でも本番に近いデータ構造・ログ体系を確認できる。

