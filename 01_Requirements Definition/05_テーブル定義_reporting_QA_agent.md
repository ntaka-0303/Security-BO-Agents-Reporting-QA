# 帳票理解・QAエージェント（報告書問い合わせ対応）テーブル定義

## 1. 概要
- 対象機能：F-001〜F-011（問い合わせ受付〜最終回答ログ）
- 対応データ項目：業務/機能要件で定義した D-001〜D-014

---

## 2. データ項目一覧

| No  | 論理名 | 物理名 | 型 | 桁数 | NULL | 説明 |
|-----|--------|--------|----|------|------|------|
| D-001 | 問い合わせID | inquiry_id | char | 36 | NOT NULL | CRMチケットID（UUID） |
| D-002 | 顧客識別子 | customer_id | varchar | 20 | NOT NULL | 顧客番号または匿名化ID |
| D-003 | 問い合わせ種別 | inquiry_category | varchar | 50 | NOT NULL | 帳票種別など |
| D-004 | 帳票ファイルパス | report_file_uri | varchar | 255 | NOT NULL | ストレージURI |
| D-005 | 問い合わせ本文 | question_text | text | - | NOT NULL | 顧客質問 |
| D-006 | 顧客属性 | customer_attributes | jsonb | - | NULL | 個人/法人、経験等 |
| D-007 | AI回答案 | ai_answer_draft | text | - | NOT NULL | LLM生成文案 |
| D-008 | 根拠参照情報 | evidence_refs | jsonb | - | NOT NULL | ページ/項目/抜粋 |
| D-009 | オペレーター編集履歴 | operator_edits | jsonb | - | NULL | 差分・コメント |
| D-010 | エスカレーション判定 | escalation_flag | boolean | 1 | NOT NULL | True=依頼あり |
| D-011 | エスカレーション理由 | escalation_reason | text | - | NULL | 理由テキスト |
| D-012 | バックオフィス回答案 | bo_response_text | text | - | NULL | 返答文 |
| D-013 | 最終回答文 | final_response_text | text | - | NOT NULL | 顧客送付文 |
| D-014 | 監査ログID | audit_log_id | char | 36 | NOT NULL | 監査ログレコードID |

---

## 3. テーブル定義

### 3.1 Inquiry（問い合わせ）
- **テーブル名**：inquiry
- **主キー**：inquiry_id
- **概要**：問い合わせ受付とAI連携設定を保持

| カラム名 | 型 | 桁数 | NULL | 説明 |
|----------|----|------|------|------|
| inquiry_id | char | 36 | NOT NULL | D-001 |
| customer_id | varchar | 20 | NOT NULL | D-002 |
| inquiry_category | varchar | 50 | NOT NULL | D-003 |
| question_text | text | - | NOT NULL | D-005 |
| customer_attributes | jsonb | - | NULL | D-006 |
| ai_enabled | boolean | 1 | NOT NULL | AI連携利用フラグ |
| created_at | timestamp | - | NOT NULL | 起票日時 |
| created_by | varchar | 50 | NOT NULL | オペレーターID |

**制約/インデックス**
- PK：pk_inquiry (inquiry_id)
- IDX：idx_inquiry_customer (customer_id)

---

### 3.2 ReportMeta（帳票メタ）
- **テーブル名**：report_meta
- **主キー**：report_meta_id
- **概要**：取得した帳票ファイルと構造化情報を管理

| カラム名 | 型 | 桁数 | NULL | 説明 |
|----------|----|------|------|------|
| report_meta_id | char | 36 | NOT NULL | 生成ID |
| inquiry_id | char | 36 | NOT NULL | D-001 FK |
| report_type | varchar | 50 | NOT NULL | 帳票種別 |
| report_file_uri | varchar | 255 | NOT NULL | D-004 |
| report_structured_json | jsonb | - | NOT NULL | セクション情報 |
| created_at | timestamp | - | NOT NULL | 取得日時 |

**制約**
- PK：pk_report_meta
- FK：fk_report_meta_inquiry (inquiry_id → inquiry.inquiry_id)

---

### 3.3 AiResponse（AI出力）
- **テーブル名**：ai_response
- **主キー**：ai_response_id
- **概要**：AI生成結果と編集履歴を保持

| カラム名 | 型 | 桁数 | NULL | 説明 |
|----------|----|------|------|------|
| ai_response_id | char | 36 | NOT NULL | レコードID |
| inquiry_id | char | 36 | NOT NULL | D-001 FK |
| ai_answer_draft | text | - | NOT NULL | D-007 |
| evidence_refs | jsonb | - | NOT NULL | D-008 |
| operator_edits | jsonb | - | NULL | D-009 |
| confidence_score | numeric | 3,2 | NOT NULL | 自信度 |
| version_no | integer | - | NOT NULL | 1〜 |
| created_at | timestamp | - | NOT NULL | 生成日時 |

**制約**
- PK：pk_ai_response
- FK：fk_ai_response_inquiry
- Unique：uniq_ai_response_version (inquiry_id, version_no)

---

### 3.4 Escalation（エスカレーション）
- **テーブル名**：escalation
- **主キー**：escalation_id
- **概要**：判定結果とバックオフィス依頼を管理

| カラム名 | 型 | 桁数 | NULL | 説明 |
|----------|----|------|------|------|
| escalation_id | char | 36 | NOT NULL | レコードID |
| inquiry_id | char | 36 | NOT NULL | D-001 |
| escalation_flag | boolean | 1 | NOT NULL | D-010 |
| escalation_reason | text | - | NULL | D-011 |
| assigned_to | varchar | 50 | NULL | 担当部署/ユーザー |
| due_date | date | - | NULL | 期限 |
| status | varchar | 20 | NOT NULL | pending/in_progress/done |
| created_at | timestamp | - | NOT NULL | 登録日時 |
| updated_at | timestamp | - | NOT NULL | 更新日時 |

**制約**
- PK：pk_escalation
- FK：fk_escalation_inquiry

---

### 3.5 FinalResponseLog（最終回答・監査）
- **テーブル名**：final_response_log
- **主キー**：audit_log_id
- **概要**：顧客送信内容と証跡を長期保管

| カラム名 | 型 | 桁数 | NULL | 説明 |
|----------|----|------|------|------|
| audit_log_id | char | 36 | NOT NULL | D-014 |
| inquiry_id | char | 36 | NOT NULL | D-001 |
| final_response_text | text | - | NOT NULL | D-013 |
| channel | varchar | 20 | NOT NULL | メール/チャット/電話 |
| sent_at | timestamp | - | NOT NULL | 送信日時 |
| sender_id | varchar | 50 | NOT NULL | オペレーターID or 自動 |
| bo_response_text | text | - | NULL | D-012 |
| attachments | jsonb | - | NULL | 添付ログ |

**制約**
- PK：pk_final_response_log
- FK：fk_final_response_inquiry
- Index：idx_final_response_sent_at

---

## 4. リレーション概要
```
inquiry (1) ── (N) report_meta
inquiry (1) ── (N) ai_response
inquiry (1) ── (0..1) escalation
inquiry (1) ── (1) final_response_log
```

---

## 5. 運用・保全
- バージョン管理：テーブル定義変更時はDBマイグレーション手順書を更新
- 監査対応：final_response_logはWORMストレージへ定期エクスポート

