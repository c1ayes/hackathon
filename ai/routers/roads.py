import json
from fastapi import APIRouter, Depends
from schemas.roads import RoadsAnalyzeRequest, RoadsAnalyzeResponse
from schemas.unified import LegacyRoadsAnalyzeResponse
from services.ollama_service import _call_ollama
from services.pipeline import run_roads_only_pipeline
from services.brain2_prompts import build_roads_only_prompt
from dependencies import load_roads_data

router = APIRouter()


@router.post("/roads", response_model=LegacyRoadsAnalyzeResponse)
def analyze_roads(
    data: RoadsAnalyzeRequest = RoadsAnalyzeRequest(),
    roads: dict = Depends(load_roads_data),
) -> LegacyRoadsAnalyzeResponse:
    """
    Analyze road maintenance priorities using Brain 1 + optional Brain 2.
    
    This endpoint now uses Brain 1 deterministic scoring as the primary analysis,
    then passes the scored output to Brain 2 (LLM) for enrichment.
    """
    # Run Brain 1 scoring
    brain1_result = run_roads_only_pipeline(roads, top_n=3)
    
    # Build Brain 2 prompt with Brain 1 output
    prompt = build_roads_only_prompt(brain1_result, top_n=3)
    
    # Add user context if provided
    if data.context:
        prompt += f"\n\nAdditional user context: {data.context}"
    
    # Call LLM for enrichment
    result = _call_ollama(prompt, max_tokens=800)
    
    # Extract top priority segment names from Brain 1
    top_segments = [
        seg["name"] for seg in brain1_result.get("segments", [])[:3]
    ]
    
    # Calculate total savings from Brain 1
    total_savings = brain1_result.get("aggregates", {}).get("total_potential_savings_tenge", 0)
    
    # Average data completeness from Brain 1
    avg_completeness = brain1_result.get("aggregates", {}).get("avg_data_completeness", 0.8)
    
    # Extract hidden risks from Brain 1 flags
    hidden_risks = []
    for seg in brain1_result.get("segments", [])[:5]:
        if seg.get("is_high_freeze_risk") and not seg.get("is_critical"):
            hidden_risks.append(f"{seg['name']}: High freeze exposure despite moderate surface condition")
        if seg.get("is_truck_heavy") and seg.get("truck_damage_factor", 1) > 2:
            hidden_risks.append(f"{seg['name']}: Accelerated decay from heavy truck traffic ({seg.get('truck_share_percent', 0)}%)")
    
    return LegacyRoadsAnalyzeResponse(
        title=str(result.get("title", "Road Maintenance Priority Analysis"))[:255],
        summary=str(result.get("summary", "")),
        top_priority_segments=result.get("top_priority_segments") if isinstance(result.get("top_priority_segments"), list) else top_segments,
        total_savings_if_fixed_now_tenge=int(result.get("total_savings_if_fixed_now_tenge", total_savings)),
        recommendations=result.get("recommendations") if isinstance(result.get("recommendations"), list) else [],
        confidence=float(result["confidence"]) if "confidence" in result else avg_completeness,
        data_completeness_score=avg_completeness,
        hidden_risks=result.get("hidden_risks") if isinstance(result.get("hidden_risks"), list) else hidden_risks[:3],
    )


@router.post("/roads/brain1")
def analyze_roads_brain1_only(
    roads: dict = Depends(load_roads_data),
) -> dict:
    """
    Roads analysis using Brain 1 only (no LLM).
    
    Returns full deterministic scoring output including:
    - Ranked segments with priority scores
    - Financial impact calculations
    - Data completeness scores
    - Risk flags
    """
    return run_roads_only_pipeline(roads, top_n=3)
