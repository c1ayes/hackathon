import json
from fastapi import APIRouter, Depends
from schemas.roads import RoadsAnalyzeRequest, RoadsAnalyzeResponse
from services.ollama_service import _call_ollama
from dependencies import load_roads_data

router = APIRouter()


@router.post("/roads", response_model=RoadsAnalyzeResponse)
def analyze_roads(
    data: RoadsAnalyzeRequest = RoadsAnalyzeRequest(),
    roads: dict = Depends(load_roads_data),
) -> RoadsAnalyzeResponse:
    segments_summary = json.dumps(roads["segments"], ensure_ascii=False, indent=2)
    aggregates = roads.get("aggregates", {})
    climate = roads.get("metadata", {}).get("climate", {})

    prompt = f"""You are analyzing road maintenance priorities for Almaty, Kazakhstan.

Climate context:
- Freeze-thaw cycles per year: {climate.get("freezeThawCyclesPerYear")}
- High-risk season months: {climate.get("highRiskSeasonMonths")}

Road segments data:
{segments_summary}

Aggregate summary:
- Total fix cost: {aggregates.get("totalFixCostTenge")} tenge
- Total emergency cost if delayed: {aggregates.get("totalEmergencyCostIfDelayedTenge")} tenge
- Total savings if fixed now: {aggregates.get("totalSavingsIfFixedNowTenge")} tenge

Based on priorityRank, failureProbability12mo, savingsIfFixedNowTenge, and freezeExposureScore:
1. Which 3 segments need immediate intervention this quarter?
2. What is the total ROI argument for acting now vs delaying?
3. Any deceptive cases (looks OK on surface but at risk)?

{f'Additional context: {data.context}' if data.context else ''}

Return this exact JSON:
{{
  "title": "short decision-ready title under 60 chars",
  "summary": "2-3 sentences with tenge figures and top risk drivers",
  "top_priority_segments": ["segment name 1", "segment name 2", "segment name 3"],
  "total_savings_if_fixed_now_tenge": <int>,
  "recommendations": [
    "Action 1 with tenge estimate",
    "Action 2 with tenge estimate",
    "Action 3 with impact"
  ],
  "confidence": 0.88
}}"""

    result = _call_ollama(prompt, max_tokens=800)
    return RoadsAnalyzeResponse(
        title=str(result.get("title", "Road Maintenance Priority Analysis"))[:255],
        summary=str(result.get("summary", "")),
        top_priority_segments=result.get("top_priority_segments") if isinstance(result.get("top_priority_segments"), list) else [],
        total_savings_if_fixed_now_tenge=int(result["total_savings_if_fixed_now_tenge"]) if "total_savings_if_fixed_now_tenge" in result else None,
        recommendations=result.get("recommendations") if isinstance(result.get("recommendations"), list) else [],
        confidence=float(result["confidence"]) if "confidence" in result else None,
    )
