# Security BO Agents - Reporting QA

本リポジトリは Reporting QA エージェントの要件定義〜PoC 実装を管理します。GitHub 上では https://github.com/ntaka-0303/Security-BO-Agents-Reporting-QA.git をリモートとして利用します。

## ディレクトリ構成
- `01_Requirements Definition/`: 業務／機能／非機能要件、テーブル定義、各種図面
- `02_Specification/`: 個別機能仕様書および PoC アーキテクチャ指針
- `03_Implementation/`: 実装資材
  - `backend/`: FastAPI ベースの API、一連のスクリプト
  - `frontend/`: Next.js 13 (App Router) クライアント
  - `docs/`: ローカルセットアップや運用ノート
  - `prompts/`: プロンプト・制約条件
- `Reporting_QA_flow.drawio`: ユースケース／フロー図

## ローカルセットアップ
1. **バックエンド**
   ```bash
   cd 03_Implementation/backend
   cp env.template .env
   poetry install
   poetry run uvicorn app.main:app --reload
   ```
2. **フロントエンド**
   ```bash
   cd 03_Implementation/frontend
   corepack enable
   pnpm install
   pnpm dev
   ```
3. **設計ドキュメント更新**
   - ドキュメントは Markdown で管理し、章構成を崩さずに更新してください。

## 運用ルール
- 仕様変更は `01_Requirements Definition` → `02_Specification` → `03_Implementation` の順で反映します。
- Pull Request ベースでレビューし、PoC で発見した課題は Issue を追加して管理します。

## 関連リポジトリ
- CA Summary エージェント: https://github.com/ntaka-0303/Security-BO-Agents-CA-Summary
