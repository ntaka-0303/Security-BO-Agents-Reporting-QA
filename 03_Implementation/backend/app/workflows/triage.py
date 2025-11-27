"""判定サポートロジック (F-007)。"""

from __future__ import annotations

from dataclasses import dataclass

from ..models import AiResponse


@dataclass
class TriageRuleConfig:
    min_confidence: float = 0.65
    max_edit_distance: float = 0.35
    danger_penalty: float = 0.1


def evaluate(
    ai_response: AiResponse,
    edit_distance: float,
    operator_confidence: float,
    danger_hits: int = 0,
    config: TriageRuleConfig | None = None,
) -> tuple[bool, float, str]:
    cfg = config or TriageRuleConfig()
    score = ai_response.confidence_score - edit_distance - cfg.danger_penalty * danger_hits
    score = (score + operator_confidence) / 2
    should_escalate = score < cfg.min_confidence

    rationale = (
        "自信度が閾値を下回っています" if should_escalate else "自動判定基準を満たしています"
    )
    return should_escalate, max(min(score, 1.0), 0.0), rationale
