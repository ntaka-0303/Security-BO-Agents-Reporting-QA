from __future__ import annotations

from functools import lru_cache


@lru_cache
def load_danger_words(path: str) -> set[str]:
    try:
        with open(path, "r", encoding="utf-8") as handle:
            return {line.strip() for line in handle if line.strip()}
    except FileNotFoundError:
        return set()


def detect_danger_words(text: str, dictionary: set[str]) -> list[str]:
    lowered = text.lower()
    hits = [word for word in dictionary if word.lower() in lowered]
    return sorted(hits)
