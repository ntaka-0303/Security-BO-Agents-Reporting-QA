"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Badge,
  Button,
  DatePicker,
  Drawer,
  Flex,
  Form,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

import { api } from "@/lib/apiClient";
import type { Notice } from "@/lib/types";

const eventOptions = [
  "配当",
  "減配",
  "株式分割",
  "TOB",
  "償還",
  "新株発行",
  "優先株発行",
  "株式移転",
];

type NoticeFormValues = {
  ca_notice_id: string;
  security_code: string;
  security_name: string;
  ca_event_type: string;
  record_date: dayjs.Dayjs;
  payment_date?: dayjs.Dayjs;
  notice_text: string;
};

export default function NoticesPage() {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<NoticeFormValues>();
  const { data, isLoading, mutate } = useSWR("notices", api.listNotices);

  const notices = useMemo(() => data ?? [], [data]);

  const columns: ColumnsType<Notice> = [
    {
      title: "CA通知ID",
      dataIndex: "ca_notice_id",
      width: 180,
      render: (id: string) => (
        <Typography.Text code copyable>
          {id}
        </Typography.Text>
      ),
    },
    {
      title: "銘柄",
      dataIndex: "security_name",
      render(_, record) {
        return (
          <Space direction="vertical" size={2}>
            <Typography.Text strong>{record.security_name}</Typography.Text>
            <Typography.Text type="secondary">{record.security_code}</Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "イベント",
      dataIndex: "ca_event_type",
      width: 140,
      render: (value: string) => <Tag color="processing">{value}</Tag>,
    },
    {
      title: "重要日付",
      key: "dates",
      width: 200,
      render(_, record) {
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text>権利確定日: {record.record_date}</Typography.Text>
            <Typography.Text type="secondary">
              支払開始日: {record.payment_date ?? "未定"}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "ステータス",
      dataIndex: "notice_status",
      width: 140,
      render: (status: string) => {
        const color =
          status === "ai-generated"
            ? "geekblue"
            : status === "draft-updated"
              ? "gold"
              : "default";
        return <Badge status="processing" color={color} text={status} />;
      },
    },
    {
      title: "最終更新",
      dataIndex: "updated_at",
      width: 200,
    },
  ];

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await api.createNotice({
        ca_notice_id: values.ca_notice_id.trim(),
        security_code: values.security_code.trim(),
        security_name: values.security_name.trim(),
        ca_event_type: values.ca_event_type,
        record_date: values.record_date.format("YYYY-MM-DD"),
        payment_date: values.payment_date?.format("YYYY-MM-DD"),
        notice_text: values.notice_text.trim(),
        source_channel: "manual",
      });
      message.success("CA通知を登録しました");
      setOpen(false);
      form.resetFields();
      mutate();
    } catch (error) {
      if ((error as Error).message) {
        message.error((error as Error).message);
      } else {
        message.error("登録に失敗しました");
      }
    }
  };

  return (
    <Flex vertical gap={16}>
      <Flex justify="space-between" align="center">
        <div>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            CA通知一覧
          </Typography.Title>
          <Typography.Text type="secondary">
            F-001/F-002: 原文取り込みと CA 管理システム連携の PoC 表示
          </Typography.Text>
        </div>
        <Button type="primary" onClick={() => setOpen(true)}>
          通知を登録
        </Button>
      </Flex>

      <Table rowKey="ca_notice_id" loading={isLoading} columns={columns} dataSource={notices} bordered />

      <Drawer
        title="CA通知の登録"
        width={520}
        open={open}
        onClose={() => setOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>キャンセル</Button>
            <Button type="primary" onClick={handleCreate}>
              登録
            </Button>
          </Space>
        }
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={{
            ca_notice_id: `CA-${Date.now()}`,
            ca_event_type: "配当",
          }}
        >
          <Form.Item
            name="ca_notice_id"
            label="CA通知ID"
            rules={[{ required: true, message: "必須項目です" }]}
          >
            <Input placeholder="例: CA-20241001-001" />
          </Form.Item>
          <Form.Item name="security_code" label="銘柄コード" rules={[{ required: true }]}>
            <Input maxLength={10} placeholder="例: 800120" />
          </Form.Item>
          <Form.Item name="security_name" label="銘柄名" rules={[{ required: true }]}>
            <Input placeholder="例: 株式会社サンプル" />
          </Form.Item>
          <Form.Item name="ca_event_type" label="イベント種別" rules={[{ required: true }]}>
            <Select options={eventOptions.map((value) => ({ value, label: value }))} />
          </Form.Item>
          <Form.Item name="record_date" label="権利確定日" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="payment_date" label="支払開始日">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="notice_text" label="原文テキスト" rules={[{ required: true }]}>
            <Input.TextArea placeholder="通知原文を貼り付け" rows={6} />
          </Form.Item>
        </Form>
      </Drawer>
    </Flex>
  );
}
