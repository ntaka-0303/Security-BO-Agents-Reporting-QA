export interface InquirySummary {
  inquiry_id: string;
  customer_id: string;
  inquiry_category: string;
  created_at: string;
}

export interface InquiryRead extends InquirySummary {
  question_text: string;
  customer_attributes?: Record<string, unknown> | null;
  ai_enabled: boolean;
  created_by: string;
}

export interface EvidenceRef {
  source: string;
  page?: string | null;
  snippet?: string | null;
}

export interface AiResponseSummary {
  ai_response_id: string;
  inquiry_id: string;
  confidence_score: number;
  version_no: number;
  created_at: string;
}

export interface AiResponseRead {
  ai_response_id: string;
  inquiry_id: string;
  ai_answer_draft: string;
  evidence_refs: EvidenceRef[];
  operator_edits?: Record<string, unknown> | null;
  confidence_score: number;
  version_no: number;
  created_at: string;
}

export interface ReportMetaRead {
  report_meta_id: string;
  inquiry_id: string;
  report_type: string;
  report_file_uri: string;
  report_structured_json: Record<string, unknown>;
  created_at: string;
}

export interface EscalationRead {
  escalation_id: string;
  inquiry_id: string;
  escalation_flag: boolean;
  escalation_reason?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  status: "pending" | "in_progress" | "done";
  created_at: string;
  updated_at: string;
}

export interface FinalResponseLog {
  audit_log_id: string;
  inquiry_id: string;
  final_response_text: string;
  channel: string;
  sent_at: string;
  sender_id: string;
  bo_response_text?: string | null;
  attachments?: Record<string, unknown>[] | null;
}

export interface TriageResult {
  should_escalate: boolean;
  rationale: string;
  recommended_channel: string;
  confidence: number;
}
