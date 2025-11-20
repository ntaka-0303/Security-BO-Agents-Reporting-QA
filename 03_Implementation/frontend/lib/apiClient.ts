import type {
  AIResponse,
  ApprovalListResponse,
  Draft,
  DraftListResponse,
  DistributionListResponse,
  DistributionRecord,
  Notice,
  NoticeListResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `API Error: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export const api = {
  async listNotices(): Promise<Notice[]> {
    const data = await request<NoticeListResponse>("/notices/");
    return data.items;
  },
  async createNotice(payload: Partial<Notice>): Promise<Notice> {
    return request<Notice>("/notices/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async createAIRequest(payload: {
    ca_notice_id: string;
    template_type: string;
    customer_segment: string;
    instructions?: string;
    created_by: string;
  }): Promise<AIResponse> {
    return request<AIResponse>("/ai/requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async listDrafts(noticeId: string): Promise<Draft[]> {
    if (!noticeId) return [];
    const data = await request<DraftListResponse>(`/drafts/${noticeId}`);
    return data.items;
  },
  async listPendingDrafts(): Promise<Draft[]> {
    const data = await request<DraftListResponse>("/drafts/pending");
    return data.items;
  },
  async saveDraft(
    noticeId: string,
    payload: {
      editor_id: string;
      edited_text: string;
      ai_output_id?: number | null;
      risk_flag: "N" | "Y";
      review_comment?: string | null;
    },
  ): Promise<Draft> {
    return request<Draft>(`/drafts/${noticeId}/save`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async submitDraft(
    draftId: number,
    payload: { submitted_by: string; risk_flag?: "N" | "Y"; comment?: string | null },
  ): Promise<Draft> {
    return request<Draft>(`/drafts/${draftId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async decideApproval(
    draftId: number,
    payload: { approver_id: string; decision: "approved" | "rejected"; comment?: string },
  ): Promise<Draft> {
    return request<Draft>(`/approvals/${draftId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async listApprovals(draftId: number): Promise<ApprovalListResponse> {
    return request<ApprovalListResponse>(`/approvals/${draftId}`);
  },
  async sendDistribution(
    draftId: number,
    payload: { channel_type: string; requested_by: string },
  ): Promise<DistributionRecord> {
    return request<DistributionRecord>(`/distribution/${draftId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async listDistributions(draftId: number): Promise<DistributionListResponse> {
    return request<DistributionListResponse>(`/distribution/${draftId}`);
  },
};

