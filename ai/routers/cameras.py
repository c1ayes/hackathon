import json
from fastapi import APIRouter, Depends
from schemas.cameras import CamerasAnalyzeRequest, CamerasAnalyzeResponse
from services.ollama_service import _call_ollama
from dependencies import load_cameras_data

router = APIRouter()


@router.post("/cameras", response_model=CamerasAnalyzeResponse)
def analyze_cameras(
    data: CamerasAnalyzeRequest = CamerasAnalyzeRequest(),
    cameras: dict = Depends(load_cameras_data),
) -> CamerasAnalyzeResponse:
    intersections_summary = json.dumps(cameras["intersections"], ensure_ascii=False, indent=2)
    aggregates = cameras.get("aggregates", {})
    fine_structure = cameras.get("metadata", {}).get("fineStructure", {})

    prompt = f"""You are analyzing traffic camera coverage gaps for Almaty, Kazakhstan.

Fine structure:
- Weighted average fine: {fine_structure.get("weightedAverageFineAllViolationsTenge")} tenge
- Collection rate: {fine_structure.get("collectionRate")}
- Camera activation speed: {fine_structure.get("cameraActivationSpeedKmh")} km/h

Intersection data:
{intersections_summary}

Key aggregate:
- Current annual revenue (4 cameras): {aggregates.get("currentAnnualRevenueAllCamerasTenge")} tenge
- Projected additional revenue if gaps filled: {aggregates.get("projectedAdditionalRevenueIfGapsFilledTenge")} tenge
- Total investment for 2 new cameras: {aggregates.get("totalInvestmentBothNewCamerasTenge")} tenge
- Combined ROI breakeven: {aggregates.get("combinedRoiBreakevenMonths")} months

IMPORTANT: Unmonitored intersections (isMonitored: false) have null violationsPerMonth —
this is survivorship bias. Absence of violation data does NOT mean absence of violations.
The coverage gap and accident history are the real risk signals.

Which 2 intersections need cameras installed first, and why?
What is the ROI case?

{f'Additional context: {data.context}' if data.context else ''}

Return this exact JSON:
{{
  "title": "short decision-ready title under 60 chars",
  "summary": "2-3 sentences: safety gap + revenue opportunity + ROI timeline",
  "top_priority_installs": ["intersection name 1", "intersection name 2"],
  "projected_additional_revenue_tenge": <int>,
  "recommendations": [
    "Install priority 1 — ROI breakeven and revenue figure",
    "Install priority 2 — ROI breakeven and revenue figure",
    "Monitoring recommendation"
  ],
  "confidence": 0.85
}}"""

    result = _call_ollama(prompt, max_tokens=800)
    return CamerasAnalyzeResponse(
        title=str(result.get("title", "Traffic Camera Coverage Analysis"))[:255],
        summary=str(result.get("summary", "")),
        top_priority_installs=result.get("top_priority_installs") if isinstance(result.get("top_priority_installs"), list) else [],
        projected_additional_revenue_tenge=int(result["projected_additional_revenue_tenge"]) if "projected_additional_revenue_tenge" in result else None,
        recommendations=result.get("recommendations") if isinstance(result.get("recommendations"), list) else [],
        confidence=float(result["confidence"]) if "confidence" in result else None,
    )
