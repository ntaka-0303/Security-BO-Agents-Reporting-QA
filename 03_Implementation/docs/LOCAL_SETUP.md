# Local Setup Guide

1. **依存のインストール**
   ```bash
   cd 03_Implementation/backend
   uv sync
   cd ../frontend
   npm install
   ```

2. **環境変数**
   - `backend/.env.example` を `.env` にコピーし、DB/Redis/LLM 設定を必要に応じて変更
   - フロントエンドは `NEXT_PUBLIC_API_BASE_URL` を `.env.local` で指定可能

3. **開発サーバー起動**
   ```bash
   # バックエンド
   uv run uvicorn app.main:app --reload

   # フロントエンド
   npm run dev
   ```

4. **Docker Compose で一体起動**
   ```bash
   cd 03_Implementation
   docker compose up --build
   ```

5. **Celery ワーカー**
   ```bash
   uv run celery -A app.workers.celery_app worker -Q reporting_qa --loglevel=info
   ```
