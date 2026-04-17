from __future__ import annotations

import re

from .models import ConstraintBundle
from .utils import strip_accents


class PromptConstraintParser:
    TAG_KEYWORDS = {
        "culture": ["culture", "van hoa", "heritage", "royal", "lang tomb", "museum"],
        "history": ["history", "historic", "lich su", "citadel", "imperial"],
        "food": ["food", "am thuc", "eat", "bun bo", "coffee", "cafe"],
        "nature": ["nature", "scenery", "song huong", "river", "garden", "park"],
        "spiritual": ["pagoda", "temple", "spiritual", "tam linh", "chua"],
        "relax": ["relax", "chill", "spa", "slow", "thu gian"]
    }

    def parse(self, prompt: str) -> ConstraintBundle:
        normalized = strip_accents(prompt.lower())
        budget = self._parse_budget(normalized)
        start_time = self._parse_start_time(normalized) or "08:00"
        max_stops = self._parse_max_stops(normalized) or 6
        tags = self._parse_tags(normalized)
        notes: list[str] = []

        if "ca ngay" in normalized or "full day" in normalized:
            end_time = "20:30"
        elif "buoi toi" in normalized or "evening" in normalized:
            end_time = "23:00"
        else:
            end_time = "21:00"

        if "it ngoai troi" in normalized or "avoid outdoor" in normalized:
            notes.append("User prefers indoor experiences.")

        return ConstraintBundle(
            budget_max=budget or 1_500_000,
            soft_tags=tags,
            hard_start=start_time,
            hard_end=end_time,
            max_stops=max_stops,
            source="heuristic-structured-parser",
            notes=notes,
        )

    def _parse_tags(self, prompt: str) -> list[str]:
        found: list[str] = []
        for tag, keywords in self.TAG_KEYWORDS.items():
            if any(keyword in prompt for keyword in keywords):
                found.append(tag)
        return found

    def _parse_start_time(self, prompt: str) -> str | None:
        match = re.search(r"\b([01]?\d|2[0-3]):([0-5]\d)\b", prompt)
        if not match:
            return None
        return f"{int(match.group(1)):02d}:{match.group(2)}"

    def _parse_max_stops(self, prompt: str) -> int | None:
        match = re.search(r"\b(\d{1,2})\s*(?:dia diem|diem|stops|places|poi)\b", prompt)
        if not match:
            return None
        return max(1, min(10, int(match.group(1))))

    def _parse_budget(self, prompt: str) -> int | None:
        if re.search(r"(budget|ngan sach).{0,10}-\d", prompt):
            raise ValueError("Budget cannot be negative.")

        context_match = re.search(
            r"(?:budget|ngan sach|toi da|max|under|duoi)\D{0,12}(\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k|nghin|vnd|dong)?",
            prompt,
        )
        if context_match:
            return self._normalize_budget(context_match.group(1), context_match.group(2))

        monetary_matches = list(
            re.finditer(
                r"\b(\d{5,}|\d+(?:[.,]\d+)?)\s*(trieu|tr|m|k|nghin|vnd|dong)\b",
                prompt,
            )
        )
        if monetary_matches:
            selected = max(
                monetary_matches,
                key=lambda item: self._normalize_budget(item.group(1), item.group(2)),
            )
            return self._normalize_budget(selected.group(1), selected.group(2))

        raw_matches = list(re.finditer(r"\b(\d{5,})\b", prompt))
        if not raw_matches:
            return None
        return max(int(match.group(1)) for match in raw_matches)

    def _normalize_budget(self, value_str: str, unit: str | None) -> int:
        value = float(value_str.replace(",", "."))
        normalized_unit = (unit or "vnd").lower()

        if normalized_unit in {"trieu", "tr", "m"}:
            return int(value * 1_000_000)
        if normalized_unit in {"k", "nghin"}:
            return int(value * 1_000)
        return int(value)
