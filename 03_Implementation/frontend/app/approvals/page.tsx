"use client";

import { useEffect, useMemo, useState } from "react";
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
  Statistic,
  Table,
  Tag,
  Tabs,
  Timeline,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import { api } from "@/lib/apiClient";
import type { ApprovalListResponse, DistributionListResponse, Draft } from "@/lib/types";

type ApprovalFormValues = {
  decision: "approved" | "rejected";
  comment?: string;
};

const APPROVER_ID = "approver.teamlead";

export default function ApprovalsPage() {
  const { data: pendingDrafts, isLoading, mutate } = useSWR("pendingDrafts", api.listPendingDrafts, {
    dedupingInterval: 5_000,
  });
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [form] = Form.useForm<ApprovalFormValues>();

  const { data: approvals, mutate: mutateApprovals } = useSWR<ApprovalListResponse>(
    selectedDraft ? ["approvals", selectedDraft.draft_id] : null,
    () => api.listApprovals(selectedDraft!.draft_id),
  );

  const { data: distributions, mutate: mutateDistributions } = useSWR<DistributionListResponse>(
    selectedDraft ? ["distributions", selectedDraft.draft_id] : null,
    () => api.listDistributions(selectedDraft!.draft_id),
  );

  useEffect(() => {
    if (selectedDraft) {
      form.setFieldsValue({
        decision: "approved",
        comment: "",
      });
    } else {
      form.resetFields();
    }
  }, [selectedDraft, form]);

  const summary = useMemo(() => {
    const drafts = pendingDrafts ?? [];
    const highRisk = drafts.filter((draft) => draft.risk_flag === "Y").length;
    const overdue = drafts.filter((draft) => {
      const updated = new Date(draft.updated_at);
      const diffHours = (Date.now() - updated.getTime()) / 3_600_000;
      return diffHours > 24;
    }).length;
    return {
      total: drafts.length,
      highRisk,
      overdue,
    };
  }, [pendingDrafts]);

  const columns: ColumnsType<Draft> = [
    {
      title: "ドラフトID",
      dataIndex: "draft_id",
    },
    {
      title: "CA通知ID",
      dataIndex: "ca_notice_id",
    },
    {
      title: "バージョン",
      dataIndex: "version_no",
      render: (value: number) => `v${value}`,
    },
    {
      title: "リスク",
      dataIndex: "risk_flag",
      render: (value: string) => (
        <Tag color={value === "Y" ? "red" : "blue"}>{value === "Y" ? "高" : "通常"}</Tag>
      ),
    },
    {
      title: "最終更新",
      dataIndex: "updated_at",
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  const handleApprove = async () => {
    if (!selectedDraft) {
      message.warning("承認対象を選択してください");
      return;
    }
    try {
      const values = await form.validateFields();
      if (values.decision === "rejected" && (!values.comment || values.comment.length < 50)) {
        message.error("差戻し時は 50 文字以上のコメントが必須です。");
        return;
      }
      const response = await api.decideApproval(selectedDraft.draft_id, {
        approver_id: APPROVER_ID,
        decision: values.decision,
        comment: values.comment,
      });
      message.success(`ドラフト ${response.draft_id} を${values.decision === "approved" ? "承認" : "差戻し"}しました`);
      mutate();
      mutateApprovals();
      setSelectedDraft(response);
    } catch (error) {
      message.error((error as Error).message || "承認操作に失敗しました");
    }
  };

  const handleSendDistribution = async () => {
    if (!selectedDraft) {
      return;
    }
    try {
      await api.sendDistribution(selectedDraft.draft_id, {
        channel_type: "email",
        requested_by: APPROVER_ID,
      });
      message.success("配信をキューに投入しました");
      mutateDistributions();
    } catch (error) {
      message.error((error as Error).message || "配信に失敗しました");
    }
  };

  return (
    <Flex vertical gap={16}>
      <div>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          承認・配信コントロール
        </Typography.Title>
        <Typography.Text type="secondary">
          F-007/F-008: 上長承認と通知配信キュー投入をここで行います
        </Typography.Text>
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic title="承認待ち" value={summary.total} suffix="件" />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="高リスク" value={summary.highRisk} suffix="件" valueStyle={{ color: "#cf1322" }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="期限超過(24h+)" value={summary.overdue} suffix="件" valueStyle={{ color: "#faad14" }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={10}>
          <Card title="承認キュー">
            <Table
              rowKey="draft_id"
              loading={isLoading}
              columns={columns}
              dataSource={pendingDrafts}
              size="small"
              pagination={false}
              onRow={(record) => ({
                onClick: () => setSelectedDraft(record),
              })}
              rowClassName={(record) =>
                record.draft_id === selectedDraft?.draft_id ? "ant-table-row-selected" : ""
              }
            />
          </Card>
        </Col>
        <Col span={14}>
          <Card title="承認詳細">
            {selectedDraft ? (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="ドラフトID">{selectedDraft.draft_id}</Descriptions.Item>
                  <Descriptions.Item label="CA通知ID">{selectedDraft.ca_notice_id}</Descriptions.Item>
                  <Descriptions.Item label="バージョン">
                    v{selectedDraft.version_no}
                  </Descriptions.Item>
                  <Descriptions.Item label="リスク">
                    <Tag color={selectedDraft.risk_flag === "Y" ? "red" : "blue"}>
                      {selectedDraft.risk_flag === "Y" ? "高" : "通常"}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>

                <Tabs
                  items={[
                    {
                      key: "draft",
                      label: "ドラフト本文",
                      children: (
                        <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
                          {selectedDraft.edited_text}
                        </Typography.Paragraph>
                      ),
                    },
                    {
                      key: "history",
                      label: "承認履歴",
                      children: approvals ? (
                        approvals.items.length > 0 ? (
                          <Timeline
                            items={approvals.items.map((item) => ({
                              color: item.decision === "approved" ? "blue" : "red",
                              children: (
                                <Space direction="vertical" size={0}>
                                  <Typography.Text>
                                    {item.decision}@{item.approver_id}
                                  </Typography.Text>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    {new Date(item.decision_at).toLocaleString()}
                                  </Typography.Text>
                                  {item.approval_comment && (
                                    <Typography.Text type="secondary">
                                      {item.approval_comment}
                                    </Typography.Text>
                                  )}
                                </Space>
                              ),
                            }))}
                          />
                        ) : (
                          <Typography.Text type="secondary">履歴はありません</Typography.Text>
                        )
                      ) : (
                        <Typography.Text type="secondary">読み込み中…</Typography.Text>
                      ),
                    },
                    {
                      key: "distribution",
                      label: "配信ログ",
                      children: distributions ? (
                        distributions.items.length > 0 ? (
                          <Space direction="vertical" style={{ width: "100%" }}>
                            {distributions.items.map((item) => (
                              <Card key={item.distribution_id} size="small">
                                <Flex align="center" justify="space-between" style={{ width: "100%" }}>
                                  <Typography.Text>
                                    {item.channel_type} / {item.distribution_status}
                                  </Typography.Text>
                                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                    {item.sent_at
                                      ? new Date(item.sent_at).toLocaleString()
                                      : "未送信"}
                                  </Typography.Text>
                                </Flex>
                                {item.result_detail && (
                                  <Typography.Text type="secondary">
                                    {item.result_detail}
                                  </Typography.Text>
                                )}
                              </Card>
                            ))}
                          </Space>
                        ) : (
                          <Typography.Text type="secondary">配信ログはありません</Typography.Text>
                        )
                      ) : (
                        <Typography.Text type="secondary">読み込み中…</Typography.Text>
                      ),
                    },
                  ]}
                />

                <Form form={form} layout="vertical">
                  <Form.Item
                    name="decision"
                    label="決裁"
                    rules={[{ required: true, message: "承認/差戻しを選択してください" }]}
                  >
                    <Radio.Group>
                      <Radio.Button value="approved">承認</Radio.Button>
                      <Radio.Button value="rejected">差戻し</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item name="comment" label="コメント">
                    <Input.TextArea rows={3} maxLength={2000} placeholder="差戻し時は 50 文字以上が必須" />
                  </Form.Item>
                </Form>

                <Space>
                  <Button type="primary" onClick={handleApprove}>
                    承認／差戻しを登録
                  </Button>
                  <Button
                    disabled={selectedDraft.approval_status !== "approved"}
                    onClick={handleSendDistribution}
                  >
                    配信を送信
                  </Button>
                </Space>
              </Space>
            ) : (
              <Typography.Text type="secondary">左の一覧から案件を選択してください。</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>
    </Flex>
  );
}

