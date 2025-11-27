export const INQUIRY_CATEGORIES = [
  "特定口座年間取引報告書",
  "取引報告書",
  "残高報告書"
];

export const CUSTOMER_TAGS = ["VIP", "要配慮", "NISA利用", "海外居住", "高アクティビティ", "再発", "重要"];

export interface CustomerProfile {
  customer_id: string;
  name: string;
  preferred_channel: string;
  attributes: string[];
  risk_level: "low" | "medium" | "high";
}

export const CUSTOMER_DIRECTORY: CustomerProfile[] = [
  {
    customer_id: "C9000001234",
    name: "田中 昭彦",
    preferred_channel: "email",
    attributes: ["VIP", "NISA利用"],
    risk_level: "medium"
  },
  {
    customer_id: "C9000005678",
    name: "佐藤 美咲",
    preferred_channel: "chat",
    attributes: ["海外居住", "重要"],
    risk_level: "high"
  },
  {
    customer_id: "C9000009999",
    name: "渡辺 恵理",
    preferred_channel: "phone",
    attributes: ["再発"],
    risk_level: "low"
  }
];

export const MODEL_PROFILES = [
  { id: "standard_rag", label: "standard_rag · 汎用帳票" },
  { id: "tax_strict", label: "tax_strict · 税務特化" },
  { id: "summary_fast", label: "summary_fast · 速報" }
];

export const ESCALATION_REASON_CODES = [
  { id: "lack_evidence", label: "根拠不足" },
  { id: "policy_check", label: "規定確認" },
  { id: "system_issue", label: "システム不具合" },
  { id: "urgent_high_value", label: "高額案件／至急" },
  { id: "customer_instruction", label: "顧客指示" }
];

export const BACKOFFICE_DEPARTMENTS = [
  { id: "tax", label: "税務バックオフィス" },
  { id: "compliance", label: "コンプライアンス" },
  { id: "operations", label: "事務運用" }
];

export const REPORT_PREVIEWS: Record<string, Array<{ title: string; page: number; text: string }>> = {
  特定口座年間取引報告書: [
    { title: "1. 年間取引サマリ", page: 3, text: "年間譲渡損益および特別分配金の内訳..." },
    { title: "2. 源泉徴収額", page: 5, text: "所得税および住民税の源泉徴収済額を記載..." }
  ],
  取引報告書: [
    { title: "1. 取引明細", page: 2, text: "株式・投信の約定一覧を掲載..." },
    { title: "2. 手数料", page: 4, text: "売買手数料および諸経費の内訳..." }
  ],
  残高報告書: [
    { title: "1. 期末残高", page: 1, text: "各商品別の評価額と数量を表示..." },
    { title: "2. 入出金履歴", page: 6, text: "対象期間の入出金と利息情報..." }
  ]
};

export function defaultScheduledAt(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 5);
  return date.toISOString().slice(0, 16);
}
