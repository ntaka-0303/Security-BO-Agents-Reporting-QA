"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Flex,
  Form,
  Input,
  message,
  Radio,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";

import { api } from "@/lib/apiClient";
import type { Draft } from "@/lib/types";

type DraftFormValues = {
  edited_text: string;
  risk_flag: "N" | "Y";
  review_comment?: string;
};

const EDITOR_ID = "drafter.user";
const SUBMITTER_ID = "drafter.user";

export default function DraftsPage() {
  const { data: pendingDrafts, isLoading, mutate } = useSWR("pendingDrafts", api.listPendingDrafts, {
    dedupingInterval: 5_000,
  });
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [form] = Form.useForm<DraftFormValues>();
  const { data: history, mutate: mutateHistory } = useSWR(
    selectedDraft ? ["draftHistory", selectedDraft.ca_notice_id] : null,
    () => api.listDrafts(selectedDraft!.ca_notice_id),
  );

  useEffect(() => {
    if (selectedDraft) {
      form.setFieldsValue({
        edited_text: selectedDraft.edited_text,
        risk_flag: selectedDraft.risk_flag,
        review_comment: selectedDraft.review_comment ?? "",
      });
    } else {
      form.resetFields();
    }
  }, [selectedDraft, form]);

  const handleSelect = (draft: Draft) => {
    setSelectedDraft(draft);
  };

  const handleSave = async () => {
    if (!selectedDraft) {
      message.warning("ドラフトを選択してください。");
      return;
    }
    try {
      const values = await form.validateFields();
      if (values.risk_flag === "Y" && !values.review_comment) {
        message.error("高リスク時はレビューコメントが必須です。");
        return;
      }
      const response = await api.saveDraft(selectedDraft.ca_notice_id, {
        editor_id: EDITOR_ID,
        edited_text: values.edited_text,
        ai_output_id: selectedDraft.ai_output_id ?? undefined,
        risk_flag: values.risk_flag,
        review_comment: values.review_comment,
      });
      message.success(`ドラフト v${response.version_no} を保存しました`);
      mutate();
      mutateHistory();
      setSelectedDraft(response);
    } catch (error) {
      message.error((error as Error).message || "保存に失敗しました");
    }
  };

  const handleSubmit = async () => {
    if (!selectedDraft) {
      message.warning("ドラフトを選択してください。");
      return;
    }
    try {
      const values = await form.validateFields();
      if (values.risk_flag === "Y" && !values.review_comment) {
        message.error("高リスク時はレビューコメントが必須です。");
        return;
      }
      const response = await api.submitDraft(selectedDraft.draft_id, {
        submitted_by: SUBMITTER_ID,
        risk_flag: values.risk_flag,
        comment: values.review_comment,
      });
      message.success("承認依頼を送信しました");
      mutate();
      mutateHistory();
      setSelectedDraft(response);
    } catch (error) {
      message.error((error as Error).message || "承認依頼に失敗しました");
    }
  };

  return (
    <Flex vertical gap={16}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          ドラフトレビュー
        </Typography.Title>
        <Typography.Text type="secondary">
          F-005/F-006: AI ドラフトを修正し、承認依頼に回すフローを管理
        </Typography.Text>
      </div>
      <Row gutter={16}>
        <Col span={10}>
          <Card title="要対応ドラフト" loading={isLoading} bodyStyle={{ padding: 0 }}>
            <div style={{ maxHeight: 560, overflow: "auto" }}>
              {(pendingDrafts ?? []).map((draft) => {
                const active = draft.draft_id === selectedDraft?.draft_id;
                return (
                  <div
                    key={draft.draft_id}
                    onClick={() => handleSelect(draft)}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                      background: active ? "#f0f5ff" : "transparent",
                    }}
                  >
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Space align="center" justify="space-between">
                        <Typography.Text strong>
                          {draft.ca_notice_id} / v{draft.version_no}
                        </Typography.Text>
                        <Tag color={draft.risk_flag === "Y" ? "red" : "blue"}>
                          {draft.risk_flag === "Y" ? "高リスク" : "通常"}
                        </Tag>
                      </Space>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        ステータス: {draft.approval_status} / 更新者: {draft.editor_id}
                      </Typography.Text>
                      <Typography.Paragraph ellipsis={{ rows: 2 }}>
                        {draft.edited_text}
                      </Typography.Paragraph>
                    </Space>
                  </div>
                );
              })}
              {(pendingDrafts ?? []).length === 0 && (
                <Flex align="center" justify="center" style={{ padding: 32 }}>
                  <Typography.Text type="secondary">Pending ドラフトはありません</Typography.Text>
                </Flex>
              )}
            </div>
          </Card>
          <Card title="バージョン履歴" style={{ marginTop: 16 }}>
            {selectedDraft ? (
              history && history.length > 0 ? (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {history.map((draft) => (
                    <Space
                      key={draft.draft_id}
                      direction="vertical"
                      style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}
                      size={2}
                    >
                      <Space align="center" justify="space-between">
                        <Typography.Text strong>
                          v{draft.version_no} / {draft.approval_status}
                        </Typography.Text>
                        <Badge
                          status={draft.risk_flag === "Y" ? "error" : "processing"}
                          text={draft.risk_flag === "Y" ? "高リスク" : "通常"}
                        />
                      </Space>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        更新: {new Date(draft.updated_at).toLocaleString()} / {draft.editor_id}
                      </Typography.Text>
                    </Space>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">履歴がありません</Typography.Text>
              )
            ) : (
              <Typography.Text type="secondary">ドラフトを選択してください</Typography.Text>
            )}
          </Card>
        </Col>
        <Col span={14}>
          <Card title="ドラフト詳細">
            {selectedDraft ? (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label="ドラフトID">{selectedDraft.draft_id}</Descriptions.Item>
                  <Descriptions.Item label="CA通知ID">{selectedDraft.ca_notice_id}</Descriptions.Item>
                  <Descriptions.Item label="バージョン">v{selectedDraft.version_no}</Descriptions.Item>
                  <Descriptions.Item label="ステータス">{selectedDraft.approval_status}</Descriptions.Item>
                  <Descriptions.Item label="AI出力ID">
                    {selectedDraft.ai_output_id ?? "-"}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新日時">
                    {new Date(selectedDraft.updated_at).toLocaleString()}
                  </Descriptions.Item>
                </Descriptions>

                <Form form={form} layout="vertical">
                  <Form.Item
                    name="edited_text"
                    label="顧客向けドラフト本文"
                    rules={[
                      { required: true, message: "ドラフト本文は必須です" },
                      { min: 20, message: "20 文字以上で入力してください" },
                    ]}
                  >
                    <Input.TextArea rows={10} />
                  </Form.Item>
                  <Form.Item name="risk_flag" label="リスク判定" rules={[{ required: true }]}>
                    <Radio.Group>
                      <Radio.Button value="N">通常</Radio.Button>
                      <Radio.Button value="Y">高リスク</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item name="review_comment" label="レビューコメント">
                    <Input.TextArea rows={3} placeholder="高リスク時は必須 (50文字以内可)" maxLength={1000} />
                  </Form.Item>
                </Form>

                <Space>
                  <Button type="primary" onClick={handleSave}>
                    保存
                  </Button>
                  <Button onClick={handleSubmit}>承認依頼</Button>
                </Space>
              </Space>
            ) : (
              <Typography.Text type="secondary">
                左ペインからドラフトを選択すると詳細を表示します。
              </Typography.Text>
            )}
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}

