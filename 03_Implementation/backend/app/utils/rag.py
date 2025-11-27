"""Simplified RAG helper.

PoC ではベクトル DB の実装を省略し、帳票メタ JSON から一致するセクションを検索する。
"""

from __future__ import annotations

from typing import Any


def find_relevant_sections(question: str, report_struct: dict[str, Any]) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = report_struct.get("sections", [])
    keywords = {token.strip().lower() for token in question.split() if len(token) > 2}
    if not keywords:
        return sections[:2]

    ranked: list[tuple[int, dict[str, Any]]] = []
    for section in sections:
        text = str(section).lower()
        score = sum(1 for kw in keywords if kw in text)
        if score:
            ranked.append((score, section))
    ranked.sort(key=lambda item: item[0], reverse=True)
    return [section for _, section in ranked[:3]] or sections[:1]
