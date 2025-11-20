"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  message,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";

import { api } from "@/lib/apiClient";
import type { AIResponse, Draft, Notice } from "@/lib/types";

type AiFormValues = {
  template_type: string;
  customer_segment: string;
  instructions?: string;
};

const templateOptions = [
  { value: "standard", label: "標準" },
  { value: "urgent", label: "至急" },
  { value: "premium", label: "プレミアム" },
];

const segmentOptions = [
  { value: "retail", label: "リテール" },
  { value: "HNWI", label: "富裕層(HNWI)" },
  { value: "institutional", label: "機関投資家" },
];

const CREATED_BY = "demo.operator";

export default function AiWorkbenchPage() {
  const { data: notices, isLoading: noticesLoading } = useSWR("notices", api.listNotices, {
    dedupingInterval: 10_000,
  });
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [form] = Form.useForm<AiFormValues>();
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: drafts, mutate: mutateDrafts } = useSWR(
    selectedNotice ? ["drafts", selectedNotice.ca_notice_id] : null,
    () => api.listDrafts(selectedNotice!.ca_notice_id),
  );

  const sortedNotices = useMemo(() => {
    return (notices ?? []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [notices]);

  const handleSelectNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    setAiResult(null);
    form.resetFields();
  };

  const handleGenerate = async () => {
    if (!selectedNotice) {
      message.warning("左ペインから CA 通知を選択してください");
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);
      const result = await api.createAIRequest({
        ca_notice_id: selectedNotice.ca_notice_id,
        template_type: values.template_type,
        customer_segment: values.customer_segment,
        instructions: values.instructions,
        created_by: CREATED_BY,
      });
      setAiResult(result);
      message.success("AI 生成が完了しました");
      mutateDrafts();
    } catch (error) {
      if ((error as Error).message) {
        message.error((error as Error).message);
      } else {
        message.error("AI リクエストに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex vertical gap={16}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          AI 入力オーケストレーション
        </Typography.Title>
        <Typography.Text type="secondary">
          F-003/F-004: 原文とテンプレ条件をセットし、AI 要約・ドラフトを生成
        </Typography.Text>
      </div>

      <Row gutter={16}>
        <Col span={10}>
          <Card loading={noticesLoading} title="CA 通知一覧" bodyStyle={{ padding: 0 }}>
            <div style={{ maxHeight: 540, overflow: "auto" }}>
              {(sortedNotices.length > 0 ? sortedNotices : []).map((notice) => {
                const active = selectedNotice?.ca_notice_id === notice.ca_notice_id;
                return (
                  <div
                    key={notice.ca_notice_id}
                    onClick={() => handleSelectNotice(notice)}
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid #f0f0f0",
                      cursor: "pointer",
                      background: active ? "#e6f4ff" : "transparent",
                    }}
                  >
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Space align="center" justify="space-between">
                        <Typography.Text strong>{notice.security_name}</Typography.Text>
                        <Badge status="processing" text={notice.notice_status} />
                      </Space>
                      <Typography.Text type="secondary">{notice.ca_event_type}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        CA通知ID: {notice.ca_notice_id}
                      </Typography.Text>
                    </Space>
                  </div>
                );
              })}
              {sortedNotices.length === 0 && (
                <Flex align="center" justify="center" style={{ padding: 40 }}>
                  <Typography.Text type="secondary">
                    CA 通知が登録されていません
                  </Typography.Text>
                </Flex>
              )}
            </div>
          </Card>
          <Card title="生成履歴" style={{ marginTop: 16 }}>
            {selectedNotice ? (
              drafts && drafts.length > 0 ? (
                <Timeline
                  items={drafts.slice(0, 5).map((draft) => ({
                    color: draft.risk_flag === "Y" ? "red" : "blue",
                    children: (
                      <Space direction="vertical" size={0}>
                        <Typography.Text strong>
                          v{draft.version_no} / {draft.approval_status}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          更新者: {draft.editor_id} / {new Date(draft.updated_at).toLocaleString()}
                        </Typography.Text>
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Typography.Text type="secondary">履歴がありません</Typography.Text>
              )
            ) : (
              <Typography.Text type="secondary">
                通知を選択すると履歴が表示されます
              </Typography.Text>
            )}
          </Card>
        </Col>

        <Col span={14}>
          <Card title="AI 条件入力" extra={selectedNotice ? selectedNotice.security_name : "通知未選択"}>
            {selectedNotice ? (
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  template_type: "standard",
                  customer_segment: "retail",
                }}
              >
                <Form.Item name="template_type" label="テンプレート種別" rules={[{ required: true }]}>
                  <Select options={templateOptions} />
                </Form.Item>
                <Form.Item name="customer_segment" label="顧客セグメント" rules={[{ required: true }]}>
                  <Radio.Group options={segmentOptions} optionType="button" />
                </Form.Item>
                <Form.Item name="instructions" label="追加指示">
                  <Input.TextArea rows={4} placeholder="例: 重要な日付を1行目に明記" maxLength={2000} />
                </Form.Item>
                <Space>
                  <Button type="primary" onClick={handleGenerate} loading={loading}>
                    AI 生成を実行
                  </Button>
                  <Button onClick={() => form.resetFields()} disabled={loading}>
                    条件リセット
                  </Button>
                </Space>
              </Form>
            ) : (
              <Typography.Text type="secondary">
                左の通知一覧から対象を選択してください。
              </Typography.Text>
            )}
          </Card>

          {aiResult && (
            <Card title="最新 AI 生成結果" style={{ marginTop: 16 }}>
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Typography.Text type="secondary">
                  モデル: {aiResult.model_version} / Draft v{aiResult.draft_version}
                </Typography.Text>
                <Flex gap={12} wrap="wrap">
                  {(aiResult.risk_tokens?.split(",") ?? [])
                    .filter((token) => token)
                    .map((token) => (
                      <Tag color="error" key={token}>
                        {token}
                      </Tag>
                    ))}
                  {(!aiResult.risk_tokens || aiResult.risk_tokens.length === 0) && (
                    <Tag color="processing">リスク検出なし</Tag>
                  )}
                  <Tag color={aiResult.risk_flag === "Y" ? "red" : "green"}>
                    リスク判定: {aiResult.risk_flag === "Y" ? "高" : "低"}
                  </Tag>
                </Flex>
                <Divider />
                <Typography.Title level={5}>社内要約</Typography.Title>
                <Typography.Paragraph>{aiResult.internal_summary}</Typography.Paragraph>
                <Divider />
                <Typography.Title level={5}>顧客向けドラフト</Typography.Title>
                <Typography.Paragraph>{aiResult.customer_draft}</Typography.Paragraph>
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </Flex>
  );
}

