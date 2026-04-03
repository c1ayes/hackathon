import json
import ollama
from fastapi import HTTPException

MODEL = "qwen2.5:7b"
SYSTEM = (
    "You are an AI analyst for the Almaty Smart City Decision Dashboard. "
    "City officials use your output to allocate budget and dispatch teams. "
    "Respond ONLY with valid JSON — no markdown, no explanation, just the JSON object."
)


def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def _city_status(risk: float) -> str:
    if risk > 0.7:
        return "critical"
    if risk > 0.45:
        return "warning"
    return "normal"


def _call_ollama(prompt: str, max_tokens: int = 1024) -> dict:
    try:
        resp = ollama.chat(
            model=MODEL,
            format="json",
            options={"num_predict": max_tokens, "temperature": 0.3},
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt},
            ],
        )
        return json.loads(resp.message.content)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {exc}")
