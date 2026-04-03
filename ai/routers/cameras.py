import json
from fastapi import APIRouter, Depends
from schemas.cameras import CamerasAnalyzeRequest, CamerasAnalyzeResponse
from schemas.unified import LegacyCamerasAnalyzeResponse
from services.ollama_service import _call_ollama
from services.pipeline import run_cameras_only_pipeline
from services.brain2_prompts import build_cameras_only_prompt
from dependencies import load_cameras_data

router = APIRouter()


@router.post("/cameras", response_model=LegacyCamerasAnalyzeResponse)
def analyze_cameras(
    data: CamerasAnalyzeRequest = CamerasAnalyzeRequest(),
    cameras: dict = Depends(load_cameras_data),
) -> LegacyCamerasAnalyzeResponse:
    """
    Analyze traffic camera coverage gaps using Brain 1 + optional Brain 2.
    
    This endpoint now uses Brain 1 deterministic scoring as the primary analysis,
    then passes the scored output to Brain 2 (LLM) for enrichment.
    
    Key feature: Survivorship bias handling is now deterministic in Brain 1.
    Unmonitored zones are flagged and prioritized based on surrounding data,
    not penalized for missing violation counts.
    """
    # Run Brain 1 scoring
    brain1_result = run_cameras_only_pipeline(cameras, top_n=3)
    
    # Build Brain 2 prompt with Brain 1 output
    prompt = build_cameras_only_prompt(brain1_result, top_n=2)
    
    # Add user context if provided
    if data.context:
        prompt += f"\n\nAdditional user context: {data.context}"
    
    # Call LLM for enrichment
    result = _call_ollama(prompt, max_tokens=800)
    
    # Extract top priority installs from Brain 1 (prioritize unmonitored)
    unmonitored_zones = [
        inter for inter in brain1_result.get("intersections", [])
        if not inter.get("is_monitored")
    ]
    top_installs = [zone["name"] for zone in unmonitored_zones[:2]]
    
    # If fewer than 2 unmonitored, add from high-priority monitored zones
    if len(top_installs) < 2:
        monitored_high_priority = [
            inter["name"] for inter in brain1_result.get("intersections", [])
            if inter.get("is_monitored") and inter.get("is_high_violation_zone")
        ]
        top_installs.extend(monitored_high_priority[:2 - len(top_installs)])
    
    # Calculate projected additional revenue from Brain 1
    projected_revenue = brain1_result.get("aggregates", {}).get("projected_additional_revenue_tenge", 0)
    
    # Average data completeness from Brain 1
    avg_completeness = brain1_result.get("aggregates", {}).get("avg_data_completeness", 0.8)
    
    # Extract survivorship bias flags
    survivorship_bias_flags = [
        inter["name"] for inter in brain1_result.get("intersections", [])
        if inter.get("is_survivorship_bias_case")
    ]
    
    return LegacyCamerasAnalyzeResponse(
        title=str(result.get("title", "Traffic Camera Coverage Analysis"))[:255],
        summary=str(result.get("summary", "")),
        top_priority_installs=result.get("top_priority_installs") if isinstance(result.get("top_priority_installs"), list) else top_installs,
        projected_additional_revenue_tenge=int(result.get("projected_additional_revenue_tenge", projected_revenue)),
        recommendations=result.get("recommendations") if isinstance(result.get("recommendations"), list) else [],
        confidence=float(result["confidence"]) if "confidence" in result else avg_completeness,
        data_completeness_score=avg_completeness,
        survivorship_bias_flags=result.get("survivorship_bias_flags") if isinstance(result.get("survivorship_bias_flags"), list) else survivorship_bias_flags,
    )


@router.post("/cameras/brain1")
def analyze_cameras_brain1_only(
    cameras: dict = Depends(load_cameras_data),
) -> dict:
    """
    Cameras analysis using Brain 1 only (no LLM).
    
    Returns full deterministic scoring output including:
    - Ranked intersections with safety gap scores
    - ROI calculations
    - Survivorship bias flags
    - Data completeness scores
    """
    return run_cameras_only_pipeline(cameras, top_n=3)
