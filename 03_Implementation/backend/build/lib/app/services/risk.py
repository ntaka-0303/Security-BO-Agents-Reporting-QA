from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Iterable, Optional

from app.config import settings

HIGH_RISK_EVENTS = {
    "tender_offer",
    "merger",
    "spin_off",
    "delisting",
    "bankruptcy",
    "litigation",
    "減資",
    "整理",
    "償還遅延",
}

MEDIUM_RISK_EVENTS = {
    "dividend_cut",
    "dividend_omit",
    "stock_split",
    "rights_issue",
    "優先株発行",
    "増資",
}


@dataclass(frozen=True)
class RiskResult:
    score: int
    flag: str  # "Y" or "N"
    tokens: tuple[str, ...]


def _prompts_dir() -> Path:
    return Path(__file__).resolve().parents[2].parent / "prompts"


@lru_cache(maxsize=1)
def _load_danger_words() -> tuple[str, ...]:
    path = _prompts_dir() / "danger_words.txt"
    if not path.exists():
        return (
            "違約",
            "遅延",
            "損失",
            "減配",
            "法的措置",
            "重大",
        )
    words = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not words:
        return (
            "違約",
            "遅延",
            "損失",
            "減配",
            "法的措置",
            "重大",
        )
    return tuple(words)


def extract_danger_tokens(text: str) -> list[str]:
    lowered = text.lower()
    tokens: list[str] = []
    for word in _load_danger_words():
        if word.lower() in lowered:
            tokens.append(word)
    return tokens


def _normalize_tokens(raw_tokens: Optional[str]) -> list[str]:
    if not raw_tokens:
        return []
    return [token.strip() for token in raw_tokens.split(",") if token.strip()]


def _score_event_type(ca_event_type: str) -> int:
    normalized = ca_event_type.lower()
    if normalized in HIGH_RISK_EVENTS:
        return 60
    if normalized in MEDIUM_RISK_EVENTS:
        return 40
    return 20


def calculate_risk_score(
    *,
    ca_event_type: str,
    risk_tokens: Optional[str],
    manual_flag: Optional[str],
    extra_signals: Optional[Iterable[str]] = None,
) -> RiskResult:
    tokens = _normalize_tokens(risk_tokens)
    if extra_signals:
        for token in extra_signals:
            if token not in tokens:
                tokens.append(token)

    score = _score_event_type(ca_event_type)

    for token in tokens:
        weight = 20 if token.lower() in {w.lower() for w in _load_danger_words()} else 10
        score += weight

    if manual_flag == "Y":
        score = max(score, settings.risk_threshold_high + 10)
    elif manual_flag == "N":
        score = min(score, settings.risk_threshold_medium - 5)

    flag = "Y" if score >= settings.risk_threshold_high else "N"

    return RiskResult(score=score, flag=flag, tokens=tuple(tokens))

