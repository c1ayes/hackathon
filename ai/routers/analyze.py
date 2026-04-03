from fastapi import APIRouter, Depends
from schemas.district import (
    DistrictAnalyzeRequest,
    DistrictAnalyzeResponse,
    SimulateRequest,
    SimulateResponse,
    SimulationMetrics,
)
from schemas.unified import UnifiedAnalysisRequest, UnifiedAnalysisResponse
from services.ollama_service import _call_ollama, _clamp, _city_status, check_ollama_health
from services.pipeline import (
    run_analysis_pipeline,
    generate_merged_recommendations,
    generate_executive_summary,
)
from dependencies import load_roads_data, load_cameras_data

router = APIRouter()


@router.post("/unified")
def analyze_unified(
    request: UnifiedAnalysisRequest = UnifiedAnalysisRequest(),
    roads: dict = Depends(load_roads_data),
    cameras: dict = Depends(load_cameras_data),
) -> dict:
    """
    Unified analysis endpoint — runs Brain 1 + Brain 2 pipeline.
    
    This is the main endpoint for the new dual-brain architecture.
    Returns merged analysis with:
    - Brain 1 deterministic scores (roads + cameras)
    - Brain 2 LLM enrichment (overlaps, anomalies, context)
    - Merged recommendations
    - Executive summary
    """
    # Run the full pipeline
    result = run_analysis_pipeline(
        roads_data=roads,
        cameras_data=cameras,
        top_n=request.top_n,
        skip_llm=False,
    )
    
    # Generate merged recommendations
    recommendations = generate_merged_recommendations(result)
    
    # Generate executive summary
    summary = generate_executive_summary(result)
    
    # Build response
    response = {
        "executive_summary": summary,
        "recommendations": recommendations,
        "analysis_metadata": result["analysis_metadata"],
    }
    
    # Include full Brain 1 output if requested
    if request.include_full_brain1:
        response["brain1_roads"] = result["brain1_roads"]
        response["brain1_cameras"] = result["brain1_cameras"]
    
    # Include Brain 2 output
    response["brain2"] = result["brain2"]
    response["key_insights"] = result["key_insights"]
    
    return response


@router.post("/unified/brain1-only")
def analyze_brain1_only(
    request: UnifiedAnalysisRequest = UnifiedAnalysisRequest(),
    roads: dict = Depends(load_roads_data),
    cameras: dict = Depends(load_cameras_data),
) -> dict:
    """
    Brain 1-only analysis — skips LLM, returns deterministic scores only.
    
    Useful for:
    - Testing Brain 1 formulas
    - Fast responses when LLM is unavailable
    - Debugging data issues
    """
    result = run_analysis_pipeline(
        roads_data=roads,
        cameras_data=cameras,
        top_n=request.top_n,
        skip_llm=True,
    )
    
    return {
        "brain1_roads": result["brain1_roads"],
        "brain1_cameras": result["brain1_cameras"],
        "analysis_metadata": result["analysis_metadata"],
    }


@router.get("/health/ollama")
def ollama_health() -> dict:
    """Check Ollama LLM service health."""
    return check_ollama_health()


@router.post("/district", response_model=DistrictAnalyzeResponse)
def analyze_district(data: DistrictAnalyzeRequest) -> DistrictAnalyzeResponse:
    report_lines = "\n".join(
        f"- [{r.category.upper()}][{r.source}] severity={r.severity_score:.2f}: {r.text}"
        for r in data.reports
    ) or "No recent reports."

    prompt = f"""Analyze district "{data.name}" in Almaty, Kazakhstan for the city dashboard.
Write all text fields in Russian.
Use only tenge for money amounts and never use dollars or USD.

Current metrics (scale 0-1 unless noted):
- risk_score: {data.risk_score} (>0.7 = critical, >0.45 = warning)
- mood_index: {data.mood_index}/100 (lower = more citizen dissatisfaction)
- pollution_index: {data.pollution_index}
- traffic_index: {data.traffic_index}
- active_complaints: {data.complaints_count}

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

    result = _call_ollama(prompt, max_tokens=800)
    return DistrictAnalyzeResponse(
        title=str(result.get("title", "Requires Attention"))[:255],
        summary=str(result.get("summary", "")),
        possible_cause=result.get("possible_cause"),
        forecast=result.get("forecast"),
        recommendations=result.get("recommendations") if isinstance(result.get("recommendations"), list) else None,
        confidence=float(result["confidence"]) if "confidence" in result else None,
    )


@router.post("/simulate", response_model=SimulateResponse)
def simulate_action(data: SimulateRequest) -> SimulateResponse:
    prompt = f"""Simulate this city intervention in Almaty district "{data.district_name}":
Action: "{data.action}"
Write all text fields in Russian.
Use only tenge for money amounts and never use dollars or USD.

Current metrics:
- risk_score: {data.before_risk} (0-1)
- complaints_count: {data.before_complaints_count}
- pollution_index: {data.before_pollution} (0-1)
- traffic_index: {data.before_traffic} (0-1)
- mood_index: {data.before_mood} (0-100)

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

    result = _call_ollama(prompt, max_tokens=400)

    after_risk = _clamp(float(result.get("after_risk", data.before_risk - 0.1)), 0.0, 1.0)
    after_complaints = max(0, int(result.get("after_complaints_count", data.before_complaints_count)))
    after_pollution = _clamp(float(result.get("after_pollution", data.before_pollution)), 0.0, 1.0)
    after_traffic = _clamp(float(result.get("after_traffic", data.before_traffic)), 0.0, 1.0)
    after_mood = _clamp(float(result.get("after_mood", data.before_mood + 5)), 0.0, 100.0)
    effect_summary = str(result.get("effect_summary", "Intervention has a positive effect on district metrics."))

    return SimulateResponse(
        district_id=data.district_id,
        action=data.action,
        before=SimulationMetrics(
            risk=data.before_risk,
            complaints_count=data.before_complaints_count,
            pollution=data.before_pollution,
            traffic=data.before_traffic,
            mood_index=data.before_mood,
        ),
        after=SimulationMetrics(
            risk=after_risk,
            complaints_count=after_complaints,
            pollution=after_pollution,
            traffic=after_traffic,
            mood_index=after_mood,
        ),
        effect_summary=effect_summary,
        city_status=_city_status(after_risk),
    )
