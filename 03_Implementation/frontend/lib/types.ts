export type Notice = {
  ca_notice_id: string;
  security_code: string;
  security_name: string;
  ca_event_type: string;
  record_date: string;
  payment_date?: string | null;
  notice_text: string;
  source_channel: string;
  notice_status: string;
  created_at: string;
  updated_at: string;
};

export type NoticeListResponse = {
  items: Notice[];
};

export type AIResponse = {
  ai_request_id: number;
  ai_output_id: number;
  internal_summary: string;
  customer_draft: string;
  model_version: string;
  risk_tokens?: string | null;
  generated_at: string;
  draft_version: number;
  risk_flag: string;
};

export type Draft = {
  draft_id: number;
  ca_notice_id: string;
  version_no: number;
  editor_id: string;
  edited_text: string;
  risk_flag: "N" | "Y";
  approval_status: string;
  review_comment?: string | null;
  updated_at: string;
  ai_output_id?: number | null;
};

export type DraftListResponse = {
  items: Draft[];
};

export type ApprovalRecord = {
  approval_id: number;
  draft_id: number;
  approver_id: string;
  decision: "approved" | "rejected";
  decision_at: string;
  approval_comment?: string | null;
};

export type ApprovalListResponse = {
  items: ApprovalRecord[];
};

export type DistributionRecord = {
  distribution_id: number;
  draft_id: number;
  channel_type: string;
  distribution_status: string;
  sent_at?: string | null;
  result_detail?: string | null;
};

export type DistributionListResponse = {
  items: DistributionRecord[];
};

