"""Minimal placeholder for PDF/HTML parsing logic.

本 PoC では帳票解析は Celery タスクからこのモジュールを呼び出す。
実際の PDF 処理はスコープ外のため、構造化済み JSON をそのまま返却する。
"""

from __future__ import annotations

from typing import Any


def extract_sections(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Return sections as-is so that RAG スタブが扱える。"""
    sections = payload.get("sections")
    if isinstance(sections, list):
        return sections
    return [payload]
