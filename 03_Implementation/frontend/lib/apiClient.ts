import type {
  AiResponseRead,
  AiResponseSummary,
  EscalationRead,
  FinalResponseLog,
  InquiryRead,
  InquirySummary,
  ReportMetaRead,
  TriageResult
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export type ApiError = Error & { status?: number };

export async function client<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const errorBody = await response.text();
    const error = new Error(`API error ${response.status}: ${errorBody}`) as ApiError;
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

export const swrFetcher = <T>(path: string) => client<T>(path);

export interface InquiryCreatePayload {
  customer_id: string;
  inquiry_category: string;
  question_text: string;
  customer_attributes?: Record<string, unknown> | null;
  created_by: string;
  ai_enabled: boolean;
}

export interface DocumentIngestPayload {
  inquiry_id: string;
  report_type: string;
  report_file_uri: string;
  report_structured_json: Record<string, unknown>;
}

export interface AiResponseCreatePayload {
  inquiry_id: string;
  prompt_overrides?: Record<string, unknown> | null;
}

export interface AiResponseReviewPayload {
  operator_edits?: Record<string, unknown> | null;
  ai_answer_draft?: string;
  confidence_score?: number;
}

export interface EscalationCreatePayload {
  inquiry_id: string;
  escalation_flag?: boolean;
  escalation_reason?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
}

export interface TriageRequestPayload {
  inquiry_id: string;
  ai_response_id: string;
  edit_distance: number;
  operator_confidence: number;
}

export interface FinalResponseCreatePayload {
  inquiry_id: string;
  final_response_text: string;
  channel: string;
  sender_id: string;
  bo_response_text?: string | null;
  attachments?: Record<string, unknown>[] | null;
}

export const api = {
  listInquiries: () => client<InquirySummary[]>("/inquiries"),
  getInquiry: (inquiryId: string) => client<InquiryRead>(`/inquiries/${inquiryId}`),
  createInquiry: (payload: InquiryCreatePayload) =>
    client<InquiryRead>("/inquiries", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  ingestDocument: (payload: DocumentIngestPayload) =>
    client<ReportMetaRead>("/documents", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  generateAiResponse: (payload: AiResponseCreatePayload) =>
    client<AiResponseRead>("/ai/responses", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  listAiResponses: () => client<AiResponseSummary[]>("/ai/responses"),
  getAiResponse: (aiResponseId: string) => client<AiResponseRead>(`/ai/responses/${aiResponseId}`),
  reviewAiResponse: (aiResponseId: string, payload: AiResponseReviewPayload) =>
    client<AiResponseRead>(`/ai/responses/${aiResponseId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  finalizeResponse: (payload: FinalResponseCreatePayload) =>
    client<FinalResponseLog>("/responses/finalize", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  createEscalation: (inquiryId: string, payload: EscalationCreatePayload) =>
    client<EscalationRead>(`/escalations/${inquiryId}`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getEscalation: (inquiryId: string) => client<EscalationRead>(`/escalations/${inquiryId}`),
  listAuditLogs: () => client<FinalResponseLog[]>("/audits/logs"),
  runTriage: (payload: TriageRequestPayload) =>
    client<TriageResult>("/workflows/triage", {
      method: "POST",
      body: JSON.stringify(payload)
    })
};
