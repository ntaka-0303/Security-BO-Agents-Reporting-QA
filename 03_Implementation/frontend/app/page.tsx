"use client";

import { Card, Col, Flex, Row, Typography } from "antd";
import Link from "next/link";

const tiles = [
  {
    title: "CA通知取込",
    description: "原文登録・AIドラフト生成・社内要約の確認",
    href: "/notices",
  },
  {
    title: "ドラフトレビュー",
    description: "最新バージョンの修正と承認依頼の状況確認",
    href: "/drafts",
  },
  {
    title: "承認・配信",
    description: "上長承認履歴と配信ログを管理",
    href: "/approvals",
  },
];

export default function HomePage() {
  return (
    <Flex vertical gap={24}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 0 }}>
          CA Summary Control Tower
        </Typography.Title>
        <Typography.Text type="secondary">要件 F-001〜F-009 の PoC オペレーションハブ</Typography.Text>
      </div>
      <Row gutter={[16, 16]}>
        {tiles.map((tile) => (
          <Col xs={24} md={8} key={tile.title}>
            <Link href={tile.href}>
              <Card hoverable>
                <Typography.Title level={4}>{tile.title}</Typography.Title>
                <Typography.Paragraph type="secondary">{tile.description}</Typography.Paragraph>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}

