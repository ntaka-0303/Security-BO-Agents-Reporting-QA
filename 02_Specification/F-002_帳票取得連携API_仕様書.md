# F-002 帳票取得連携API 仕様書

## 1. 概要

* **ドキュメント名**：F-002 帳票取得連携API 仕様書
* **対象機能**：問い合わせチケットに紐づく帳票を帳票システム（S-002）から取得し、ストレージ・メタ情報を登録する API
* **対応する機能要件**：業務要件 P-002、機能要件 F-002
* **担当者**：Reporting QA バックエンド/API チーム
* **前提条件**：
  - inquiry_id と報告書種別が CRM から提供済み
  - S-002 側 API クライアント証明書/OAuth クレデンシャルを保持
  - 帳票ファイルは PDF/HTML 形式で保存されている
* **制約条件**：
  - PoC 対象帳票（特定口座年間取引報告書・取引報告書・残高報告書）のみ
  - 署名付き URL は 10 分で失効し、社内ネットワークからのみアクセス可
  - 個人情報を含むため TLS1.2 以上必須、ログは暗号化保管

---

## 2. 画面仕様（UI仕様）

*本機能は API のため UI なし（INQ-001/F-003 から非同期で呼び出される）。*

---

## 3. 処理仕様（ロジック仕様）

### 3.1 処理概要フロー

1. CRM から inquiry_id・report_type を受領
2. 帳票検索 API で対象帳票を照会
3. 帳票ダウンロード API で PDF/HTML を取得、暗号化ストレージへ保存
4. セクション・メタ情報を生成して `report_meta` に登録
5. 署名付き URL・構造化 JSON を応答

### 3.2 処理詳細

| 手順 | 処理内容 | 入力 | 出力 | 備考 |
| ---- | -------- | ---- | ---- | ---- |
| 1 | リクエスト検証 | inquiry_id, report_type | 検証結果 | PoC対象判定 |
| 2 | 帳票検索 | パラメータ | report_id | API `GET /reports?customer_id=...` |
| 3 | 帳票ダウンロード | report_id | report_file | 圧縮+暗号化 |
| 4 | ストレージ保存 | report_file | report_file_uri | 署名付きURL生成 |
| 5 | メタ生成 | report_file | report_structured_json | DOM/PDF解析 (F-004連携) |
| 6 | DB登録 | 各種データ | report_meta レコード | トランザクション |
| 7 | レスポンス返却 | 成功/失敗 | JSON応答 | 有効期限含む |

### 3.3 業務ルール

* ダウンロード可否は顧客同意と権限で判定し、NG の場合は `ERR-020`
* 帳票取得ジョブは 30 秒以内に完了しない場合タイムアウト扱い
* 署名付き URL が失効した場合は再発行 API を呼び出す（最大 3 回）

### 3.4 例外処理

* 帳票未存在：`ERR-020` を返却し、F-003 へ「帳票なし」ステータス送信
* 認証失敗：自動再認証を 1 回実施、失敗時は `ERR-021`
* ストレージ保存失敗：保存先をロールバックし、再試行キューへ登録

---

## 4. API / 外部システム連携仕様

### 4.1 API一覧

| API ID | API名称 | IF種別 | 呼び出し方向 |
| ------ | ------- | ------ | ------------ |
| API-RPT-01 | 帳票検索API | REST/JSON | 本システム → S-002 |
| API-RPT-02 | 帳票ダウンロードAPI | REST/Binary | 本システム → S-002 |
| API-STG-01 | 署名付きURL発行API | REST/JSON | 本システム → ストレージ |

### 4.2 APIリクエスト仕様（例：帳票検索）

```
GET /api/v1/reports?customer_id=C123456&report_type=annual
Authorization: Bearer <token>
```

### 4.3 APIレスポンス仕様

```json
{
  "report_id": "RPT-2025-0001",
  "available": true,
  "metadata": {
    "issued_date": "2025-01-31",
    "pages": 12
  }
}
```

### 4.4 エラー仕様

| エラーコード | 内容 | 対処 |
| ------------ | ---- | ---- |
| 404 | 帳票未存在 | ERR-020 を F-003 に伝播 |
| 401 | 認証失敗 | トークン再取得後に再試行 |
| 503 | 外部システム障害 | 1 分間隔で 3 回リトライ |

---

## 5. データ仕様（データ定義）

### 5.1 データ項目一覧

| No | 論理名 | 物理名 | 型 | NULL | 説明 |
| -- | ------ | ------ | -- | ---- | ---- |
| D-001 | 問い合わせID | inquiry_id | char(36) | NOT NULL | FK |
| report_meta_id | 帳票メタID | report_meta_id | char(36) | NOT NULL | UUID |
| report_type | 帳票種別 | report_type | varchar(50) | NOT NULL | |
| D-004 | 帳票ファイルパス | report_file_uri | varchar(255) | NOT NULL | 署名付きURL |
| report_structured_json | 構造化情報 | report_structured_json | jsonb | NOT NULL | セクション一覧 |
| created_at | 取得日時 | created_at | timestamp | NOT NULL | |

### 5.2 テーブル定義

* **テーブル**：report_meta
* **主キー**：report_meta_id
* **FK**：inquiry_id → inquiry.inquiry_id
* **インデックス**：report_type + created_at で検索性確保

---

## 6. シーケンス図（概要）

```
AI入力UI/オペレーター →[帳票要求]→ 帳票取得API(F-002)
帳票取得API →[検索]→ S-002 帳票システム
S-002 →[report_id]→ 帳票取得API
帳票取得API →[ダウンロード]→ S-002
帳票取得API →[保存]→ ストレージ
帳票取得API →[メタ登録]→ DB(report_meta)
帳票取得API →[URL,構造化情報]→ 呼出元(F-003)
```

