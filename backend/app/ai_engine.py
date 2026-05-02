import asyncio
import json
import os
import re
from typing import Any

import numpy as np
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("XAI_API_KEY"),
    base_url=os.getenv("XAI_BASE_URL", "https://api.groq.com/openai/v1"),
)

MODEL_NAME = "llama-3.3-70b-versatile"


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    vector_1 = np.array(v1, dtype=float)
    vector_2 = np.array(v2, dtype=float)

    norm_1 = np.linalg.norm(vector_1)
    norm_2 = np.linalg.norm(vector_2)
    if norm_1 == 0 or norm_2 == 0:
        return 0.0

    return float(np.dot(vector_1, vector_2) / (norm_1 * norm_2))


def _default_analysis() -> dict[str, Any]:
    return {
        "match_score": 0,
        "keyword_score": 0,
        "semantic_score": 0,
        "missing_keywords": [],
        "improvements": ["Could not analyze. Please try again."],
        "rewritten_summary": "",
        "ats_tips": [],
    }


def _to_score(value: Any) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(100.0, score))


def _normalize_result(payload: dict[str, Any]) -> dict[str, Any]:
    defaults = _default_analysis()
    normalized = {**defaults, **payload}

    normalized["match_score"] = _to_score(normalized.get("match_score"))
    normalized["keyword_score"] = _to_score(normalized.get("keyword_score"))
    normalized["semantic_score"] = _to_score(normalized.get("semantic_score"))

    if not isinstance(normalized.get("missing_keywords"), list):
        normalized["missing_keywords"] = []
    if not isinstance(normalized.get("improvements"), list):
        normalized["improvements"] = []
    if not isinstance(normalized.get("ats_tips"), list):
        normalized["ats_tips"] = []
    if not isinstance(normalized.get("rewritten_summary"), str):
        normalized["rewritten_summary"] = ""

    return normalized


async def run_hybrid_analysis(resume_text: str, job_desc: str) -> dict[str, Any]:
    system_prompt = (
        "You are an ATS and recruiting optimization expert. Analyze a candidate resume "
        "against the target job description using a hybrid strategy:\n"
        "1) keyword matching,\n"
        "2) semantic matching,\n"
        "3) overall weighted score.\n\n"
        "Return STRICT JSON only using this exact schema:\n"
        "{\n"
        '  "match_score": 0,\n'
        '  "keyword_score": 0,\n'
        '  "semantic_score": 0,\n'
        '  "missing_keywords": [],\n'
        '  "improvements": [],\n'
        '  "rewritten_summary": "",\n'
        '  "ats_tips": []\n'
        "}\n"
        "All score fields must be numbers between 0 and 100."
    )

    user_prompt = (
        f"RESUME TEXT:\n{resume_text}\n\n"
        f"JOB DESCRIPTION:\n{job_desc}\n\n"
        "Provide the hybrid analysis now."
    )

    try:
        try:
            completion = await asyncio.to_thread(
                client.chat.completions.create,
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            content = completion.choices[0].message.content or "{}"
            parsed = json.loads(content)
            if not isinstance(parsed, dict):
                return _default_analysis()
            return _normalize_result(parsed)
        except Exception as exc:
            message = str(exc).lower()
            if "response_format" not in message or (
                "not support" not in message and "unsupported" not in message
            ):
                raise
            fallback_completion = await asyncio.to_thread(
                client.chat.completions.create,
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
            )
            fallback_content = fallback_completion.choices[0].message.content or ""
            match = re.search(r"\{.*\}", fallback_content, re.DOTALL)
            result = json.loads(match.group()) if match else {}
            if not isinstance(result, dict):
                return _default_analysis()
            return _normalize_result(result)
    except Exception:
        return _default_analysis()
