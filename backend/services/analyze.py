import json
import ollama
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.models import (
    DistrictModel,
    ReportModel,
    AIInsightModel,
    ActionModel,
    SimulationResultModel,
)

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


def analyze_district(district_id: int, db: Session) -> AIInsightModel:
    district = db.query(DistrictModel).filter_by(id=district_id).first()

    reports = (
        db.query(ReportModel)
        .filter_by(district_id=district_id)
        .order_by(ReportModel.severity_score.desc())
        .limit(10)
        .all()
    )

    report_lines = "\n".join(
        f"- [{r.category.upper()}][{r.source}] severity={r.severity_score:.2f}: {r.text}"
        for r in reports
    ) or "No recent reports."

    prompt = f"""Analyze district "{district.name}" in Almaty, Kazakhstan for the city dashboard.

Current metrics (scale 0-1 unless noted):
- risk_score: {district.risk_score} (>0.7 = critical, >0.45 = warning)
- mood_index: {district.mood_index}/100 (lower = more citizen dissatisfaction)
- pollution_index: {district.pollution_index}
- traffic_index: {district.traffic_index}
- active_complaints: {district.complaints_count}

Top citizen reports (by severity):
{report_lines}

Dashboard priorities:
1. Road Decay ROI — compare fix-now cost vs emergency repair cost in tenge
2. Traffic Safety — camera coverage gaps, fine revenue potential, accident prevention

Answer three questions a city official needs:
1. What is happening? (brief situation)
2. How critical is it? (use the risk score and trend)
3. What should be done? (specific, ranked actions with tenge estimates)

Return this exact JSON (all fields required):
{{
  "title": "short alert title under 60 chars",
  "summary": "2-3 sentences: situation + criticality level",
  "possible_cause": "1-2 sentences on root cause",
  "forecast": "what happens in 30 days without intervention",
  "recommendations": [
    "Priority 1 action — cost/savings estimate in tenge",
    "Priority 2 action — cost/savings estimate in tenge",
    "Priority 3 action — estimated impact"
  ],
  "confidence": 0.82
}}"""

    data = _call_ollama(prompt, max_tokens=800)

    insight = AIInsightModel(
        district_id=district_id,
        title=str(data.get("title", "Требуется внимание"))[:255],
        summary=str(data.get("summary", "")),
        possible_cause=data.get("possible_cause"),
        forecast=data.get("forecast"),
        recommendations=data.get("recommendations") if isinstance(data.get("recommendations"), list) else None,
        confidence=float(data["confidence"]) if "confidence" in data else None,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight


def simulate_action(district_id: int, action: str, db: Session) -> dict:
    district = db.query(DistrictModel).filter_by(id=district_id).first()

    prompt = f"""Simulate this city intervention in Almaty district "{district.name}":
Action: "{action}"

Current metrics:
- risk_score: {district.risk_score} (0-1)
- complaints_count: {district.complaints_count}
- pollution_index: {district.pollution_index} (0-1)
- traffic_index: {district.traffic_index} (0-1)
- mood_index: {district.mood_index} (0-100)

Predict realistic metrics after 30 days. Rules:
- Road repair actions: risk_score drops 0.15-0.35, mood rises 10-25 points
- Camera/safety actions: traffic_index drops 0.10-0.25, complaints drop 15-35%
- Lighting/ecology actions: pollution or mood improvement
- All values must stay in valid range: risk/pollution/traffic in [0.0, 1.0], mood in [0.0, 100.0], complaints >= 0
- Show meaningful improvement (at least 15% change in primary metric)

Return this exact JSON:
{{
  "after_risk": <float 0-1>,
  "after_complaints_count": <int>,
  "after_pollution": <float 0-1>,
  "after_traffic": <float 0-1>,
  "after_mood": <float 0-100>,
  "effect_summary": "2 sentences with specific projected impact and tenge savings or revenue figures"
}}"""

    data = _call_ollama(prompt, max_tokens=400)

    after_risk = _clamp(float(data.get("after_risk", district.risk_score - 0.1)), 0.0, 1.0)
    after_complaints = max(0, int(data.get("after_complaints_count", district.complaints_count)))
    after_pollution = _clamp(float(data.get("after_pollution", district.pollution_index)), 0.0, 1.0)
    after_traffic = _clamp(float(data.get("after_traffic", district.traffic_index)), 0.0, 1.0)
    after_mood = _clamp(float(data.get("after_mood", district.mood_index + 5)), 0.0, 100.0)
    effect_summary = str(data.get("effect_summary", "Интервенция оказывает положительный эффект на показатели района."))

    action_rec = ActionModel(
        district_id=district_id,
        action_type="simulation",
        title=action[:255],
        description=effect_summary,
    )
    db.add(action_rec)
    db.flush()

    sim = SimulationResultModel(
        action_id=action_rec.id,
        before_risk=district.risk_score,
        after_risk=after_risk,
        before_mood=district.mood_index,
        after_mood=after_mood,
        before_traffic=district.traffic_index,
        after_traffic=after_traffic,
        before_pollution=district.pollution_index,
        after_pollution=after_pollution,
        effect_summary=effect_summary,
    )
    db.add(sim)
    db.commit()

    return {
        "district_id": district_id,
        "action": action,
        "before": {
            "risk": district.risk_score,
            "complaints_count": district.complaints_count,
            "pollution": district.pollution_index,
            "traffic": district.traffic_index,
            "mood_index": district.mood_index,
        },
        "after": {
            "risk": after_risk,
            "complaints_count": after_complaints,
            "pollution": after_pollution,
            "traffic": after_traffic,
            "mood_index": after_mood,
        },
        "effect_summary": effect_summary,
        "city_status": _city_status(after_risk),
    }
