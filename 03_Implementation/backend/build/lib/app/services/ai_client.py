from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from textwrap import dedent
from typing import Any

import httpx

from app.config import settings
from app.schemas.ai import AIRequestPayload
from app.services import risk

logger = logging.getLogger(__name__)


@dataclass
class AIResult:
    internal_summary: str
    customer_draft: str
    model_version: str
    risk_tokens: str | None = None


def _prompts_dir() -> Path:
    return Path(__file__).resolve().parents[2].parent / "prompts"


def _load_base_prompt() -> str:
    path = _prompts_dir() / "base_prompt.md"
    if not path.exists():
        return dedent(
            """
            You are a bilingual financial analyst who prepares concise internal summaries
            and polite Japanese customer notifications for corporate action events.
            Output strict JSON with the following keys:
            internal_summary (JP), customer_draft (JP), risk_tokens (array of strings).
            """
        ).strip()
    return path.read_text(encoding="utf-8").strip()


def _build_messages(payload: AIRequestPayload) -> list[dict[str, str]]:
    system_prompt = _load_base_prompt()
    user_prompt = dedent(
        f"""
        [CA NOTICE CONTEXT]
        銘柄名: {payload.security_name} ({payload.security_code})
        イベント種別: {payload.ca_event_type}
        権利確定日: {payload.record_date}
        支払開始日: {payload.payment_date or "未定"}
        テンプレート: {payload.template_type}
        セグメント: {payload.customer_segment}
        追加指示: {payload.instructions or "なし"}
        原文:
        {payload.notice_text}

        必ず JSON 形式 (keys: internal_summary, customer_draft, risk_tokens) で返却してください。
        """
    ).strip()
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]


def _parse_llm_response(content: str) -> dict[str, Any]:
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        logger.warning("LLM response was not valid JSON. Falling back to heuristic parser.")
        return {
            "internal_summary": content.strip(),
            "customer_draft": content.strip(),
            "risk_tokens": [],
        }


async def _call_llm(payload: AIRequestPayload) -> AIResult | None:
    if not settings.ai_api_key:
        return None

    body = {
        "model": settings.ai_model,
        "messages": _build_messages(payload),
        "temperature": 0.2,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "ca_notification",
                "schema": {
                    "type": "object",
                    "properties": {
                        "internal_summary": {"type": "string"},
                        "customer_draft": {"type": "string"},
                        "risk_tokens": {
                            "type": "array",
                            "items": {"type": "string"},
                            "default": [],
                        },
                    },
                    "required": ["internal_summary", "customer_draft"],
                    "additionalProperties": False,
                },
            },
        },
    }

    headers = {
        "Authorization": f"Bearer {settings.ai_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=40) as client:
            response = await client.post(settings.ai_base_url, headers=headers, json=body)
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = _parse_llm_response(content)
            risk_tokens = parsed.get("risk_tokens") or []
            if isinstance(risk_tokens, str):
                tokens_list = [risk_tokens]
            else:
                tokens_list = risk_tokens
            return AIResult(
                internal_summary=parsed.get("internal_summary", "").strip(),
                customer_draft=parsed.get("customer_draft", "").strip(),
                model_version=data.get("model", settings.ai_model),
                risk_tokens=",".join(tokens_list) if tokens_list else None,
            )
    except Exception as exc:
        logger.error("LLM request failed: %s", exc, exc_info=True)
        return None


def _heuristic_summary(payload: AIRequestPayload) -> AIResult:
    intro = f"{payload.security_name}に関する{payload.ca_event_type}の要約です。"
    summary = dedent(
        f"""
        {intro}
        ・権利確定日: {payload.record_date}
        ・支払開始日: {payload.payment_date or "未定"}
        ・対象セグメント: {payload.customer_segment}
        重要ポイントを確認のうえ、テンプレート {payload.template_type} に沿って通知してください。
        """
    ).strip()

    draft = dedent(
        f"""
        {payload.customer_segment}のお客様各位

        {payload.security_name}より「{payload.ca_event_type}」に関するご案内です。
        権利確定日は {payload.record_date}、支払開始日は {payload.payment_date or "未定"} です。
        詳細:
        {payload.notice_text[:600]}{'...' if len(payload.notice_text) > 600 else ''}

        ご不明点がございましたら担当窓口までお問い合わせください。
        """
    ).strip()

    risk_tokens = risk.extract_danger_tokens(payload.notice_text)

    return AIResult(
        internal_summary=summary,
        customer_draft=draft,
        model_version="heuristic-v1",
        risk_tokens=",".join(risk_tokens) if risk_tokens else None,
    )


async def generate_draft(payload: AIRequestPayload) -> AIResult:
    result = await _call_llm(payload)
    if result:
        return result
    return _heuristic_summary(payload)
