# Backend (FastAPI)

## 概要
- FastAPI + SQLAlchemy で BFF/API サーバーを実装
- Celery + Redis を利用して帳票解析／LLM 推論／送信ジョブを非同期化
- ORM モデルは 05_テーブル定義（D-001〜D-014）を完全に反映

## 主要ディレクトリ
- `app/main.py` : FastAPI エントリーポイント
- `app/config.py` : 設定 (`Settings`)。DB, Redis, OpenAI, Vector Store など
- `app/db` : `base.py`, `session.py` など SQLAlchemy 基盤
- `app/models` : ORM モデル（`inquiry.py`, `report_meta.py`, ...）
- `app/schemas` : API I/O スキーマ（仕様書準拠）
- `app/services` : 業務ロジック／AI 連携／監査
- `app/routers` : ルーティング層。P-001〜P-011 に対応
- `app/workflows` : 判定ルール(F-007)
- `app/workers` : Celery アプリとタスク

## ローカル起動
```bash
uv sync
uv run uvicorn app.main:app --reload
```

## マイグレーション
```bash
alembic revision --autogenerate -m "describe changes"
alembic upgrade head
```
