# ローカル実行手順

CA Summary PoC をローカルで動かすためのセットアップ手順です。  
（本リポジトリのルートを `${REPO}` と表記します）

## 1. 事前準備

| 種別 | 推奨バージョン | 備考 |
| --- | --- | --- |
| Python | 3.11.x | `python -V` で確認 |
| Node.js | 18 LTS 以上 | `node -v` で確認 |
| npm | 10 以上 | `npm -v` で確認 |

※ 今回の作業環境では `pip`/`npm` が未導入だったため、以下コマンドで導入してください。

```bash
# Debian/Ubuntu 系の場合の例
sudo apt-get update
sudo apt-get install -y python3-pip nodejs npm

# もしくは uv を利用する場合
curl -LsSf https://astral.sh/uv/install.sh | sh
uv pip install -e backend
uv pip install fastapi uvicorn sqlmodel ...
```

## 2. バックエンド

```bash
cd "${REPO}/03_Implementation/backend"
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp env.example .env  # 必要に応じて編集
python scripts/init_db.py
uvicorn app.main:app --reload --port 8000
```

### 外部システムスタブ

`/api/stubs/...` にモック API を用意しています。

| Stub | エンドポイント | 概要 |
| --- | --- | --- |
| S-001（CA管理） | `GET /api/stubs/s001/notices/{ca_notice_id}` | 銘柄情報・重要日付を返却 |
|  | `GET /api/stubs/s001/securities/{security_code}` | 銘柄マスタを返却 |
| S-003（配信） | `POST /api/stubs/s003/distributions` | 配信キュー登録の疑似レスポンス |
| S-004（ワークフロー） | `POST /api/stubs/s004/workflow` | 承認ステータス更新の疑似レスポンス |

いずれもローカル DB を参照せず固定レスポンスを返します。  
フロントから外部システムを想定した疎通確認を行う際に利用してください。

## 3. フロントエンド

```bash
cd "${REPO}/03_Implementation/frontend"
npm install
cp .env.local.example .env.local # 必要に応じて作成
npm run dev -- --port 3000
```

`NEXT_PUBLIC_API_BASE` を `.env.local` で `http://localhost:8000/api` に設定します。

## 4. 動作確認

1. `http://localhost:3000` を開く
2. `CA通知取込` で CA 通知を登録
3. `AI 入力` ページで通知を選択し AI 生成（API キー未設定でもスタブ出力で動作）
4. `ドラフトレビュー` で修正／承認依頼
5. `承認・配信` で承認 → 配信スタブ呼び出し

バックエンドのログには監査イベントが出力され、DB（SQLite）に保存されます。

