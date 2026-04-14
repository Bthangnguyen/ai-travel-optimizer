from __future__ import annotations

from typing import Any

from backend.app.parser import PromptConstraintParser, SAFE_DEFAULT_JSON, StructuredPlanInput


def test_standard_valid_input_returns_expected_constraints() -> None:
    async def llm_ok(
        system_prompt: str,
        user_prompt: str,
        response_model: type[StructuredPlanInput],
        max_retries: int,
    ) -> dict[str, Any]:
        assert "Return ONLY a JSON object" in system_prompt
        assert "Hue" in user_prompt
        assert response_model is StructuredPlanInput
        assert max_retries >= 2
        return {
            "budget_max": "1.8tr",
            "soft_tags": ["food", "culture", "food"],
            "hard_start": "2026-04-13T09:15:00",
            "Time_Windows": [
                {"start": "09:15", "end": "12:00", "label": "morning"},
                {"start": "14:00", "end": "18:30", "label": "afternoon"},
            ],
            "ambiguity_notes": [],
            "parser_notes": ["LLM extraction succeeded."],
        }

    parser = PromptConstraintParser(llm_gateway=llm_ok, max_retries=3)
    parsed = parser.parse("Plan a Hue food and culture day from 9:15, budget 1.8 million VND.")

    assert parsed.budget_max == 1_800_000
    assert parsed.soft_tags == ["food", "culture"]
    assert parsed.hard_start == "09:15"
    assert parsed.hard_end == "18:30"
    assert parsed.source == "llm-structured-parser"


def test_ambiguous_or_conflicting_constraints_are_stabilized() -> None:
    async def llm_conflicting(
        _system_prompt: str,
        _user_prompt: str,
        _response_model: type[StructuredPlanInput],
        _max_retries: int,
    ) -> dict[str, Any]:
        return {
            "budget_max": "1200k",
            "soft_tags": "culture, relax",
            "hard_start": "9h30",
            "Time_Windows": [{"start": "18:00", "end": "09:00"}],
            "ambiguity_notes": ["Conflicting window detected."],
            "parser_notes": [],
        }

    parser = PromptConstraintParser(llm_gateway=llm_conflicting)
    structured = parser.parse_structured(
        "I can do morning and evening but maybe start late and keep it flexible."
    )

    assert structured.budget_max == 1_200_000
    assert structured.soft_tags == ["culture", "relax"]
    assert structured.hard_start == "09:30"
    assert structured.Time_Windows[0].start == "18:00"
    assert structured.Time_Windows[0].end == "18:00"


def test_garbage_and_prompt_injection_never_crash_and_still_validate() -> None:
    async def llm_noisy(
        _system_prompt: str,
        _user_prompt: str,
        _response_model: type[StructuredPlanInput],
        _max_retries: int,
    ) -> dict[str, Any]:
        return {
            "budget_max": "not-a-number",
            "soft_tags": [123, "", None, "nature"],
            "hard_start": "??",
            "Time_Windows": "drop database now",
            "ambiguity_notes": "unclear",
            "parser_notes": [],
        }

    parser = PromptConstraintParser(llm_gateway=llm_noisy)
    structured = parser.parse_structured("'; DROP TABLE plans; -- ### random chars $$$$")

    assert structured.budget_max == 10_000_000
    assert structured.soft_tags == ["123", "none", "nature"]
    assert structured.hard_start == "08:00"
    assert isinstance(structured.Time_Windows, list)
    assert structured.Time_Windows[0].start == "08:00"
    assert structured.Time_Windows[0].end == "22:00"


def test_llm_failure_returns_safe_default_json() -> None:
    async def llm_broken(
        _system_prompt: str,
        _user_prompt: str,
        _response_model: type[StructuredPlanInput],
        _max_retries: int,
    ) -> StructuredPlanInput:
        raise TimeoutError("Simulated LLM timeout")

    parser = PromptConstraintParser(llm_gateway=llm_broken, max_retries=3)
    structured = parser.parse_structured("Plan anything")

    assert structured.model_dump()["budget_max"] == SAFE_DEFAULT_JSON["budget_max"]
    assert structured.model_dump()["soft_tags"] == SAFE_DEFAULT_JSON["soft_tags"]
    assert structured.model_dump()["hard_start"] == SAFE_DEFAULT_JSON["hard_start"]
    assert structured.model_dump()["Time_Windows"] == SAFE_DEFAULT_JSON["Time_Windows"]
    assert "Safe fallback path used." in structured.parser_notes
    assert any("TimeoutError" in note for note in structured.parser_notes)
