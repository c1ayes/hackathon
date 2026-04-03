from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from dependencies import get_db
from models.models import (
    DistrictModel,
    ReportModel,
    AIInsightModel,
    ActionModel,
    SimulationResultModel,
)
from schemas.analyze import AnalyzeRequest, AnalyzeResponse
from schemas.city_state import CityStateResponse, CitySummaryResponse
from schemas.simulate_action import (
    SimulateActionRequest,
    SimulateActionResponse,
    SimulationBeforeAfter,
)
from services import ai_client

router = APIRouter(prefix="/city", tags=["City"])


@router.get("/state", response_model=CityStateResponse)
def get_city_state(db: Session = Depends(get_db)):
    districts = db.query(DistrictModel).order_by(DistrictModel.risk_score.desc()).all()
    complaints = db.query(ReportModel).order_by(ReportModel.created_at.desc()).limit(50).all()

    total_complaints = db.query(func.sum(DistrictModel.complaints_count)).scalar() or 0
    critical_n = db.query(func.count(DistrictModel.id)).filter(DistrictModel.status == "critical").scalar() or 0
    avg_mood = db.query(func.avg(DistrictModel.mood_index)).scalar() or 100.0

    city_status = "critical" if critical_n >= 2 else ("warning" if critical_n >= 1 else "normal")

    return CityStateResponse(
        city_status=city_status,
        districts=districts,
        complaints=complaints,
        summary=CitySummaryResponse(
            total_complaints=total_complaints,
            critical_districts=critical_n,
            mood_index=round(avg_mood, 1),
        ),
    )


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_district(data: AnalyzeRequest, db: Session = Depends(get_db)):
    district = db.query(DistrictModel).filter_by(id=data.district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    reports = (
        db.query(ReportModel)
        .filter_by(district_id=data.district_id)
        .order_by(ReportModel.severity_score.desc())
        .limit(10)
        .all()
    )

    payload = {
        "district_id": district.id,
        "name": district.name,
        "risk_score": district.risk_score,
        "mood_index": district.mood_index,
        "pollution_index": district.pollution_index,
        "traffic_index": district.traffic_index,
        "complaints_count": district.complaints_count,
        "reports": [
            {
                "category": r.category,
                "source": r.source,
                "severity_score": r.severity_score,
                "text": r.text,
            }
            for r in reports
        ],
    }

    ai_result = await ai_client.call_analyze_district(payload)

    insight = AIInsightModel(
        district_id=data.district_id,
        title=str(ai_result.get("title", "Requires Attention"))[:255],
        summary=str(ai_result.get("summary", "")),
        possible_cause=ai_result.get("possible_cause"),
        forecast=ai_result.get("forecast"),
        recommendations=ai_result.get("recommendations") if isinstance(ai_result.get("recommendations"), list) else None,
        confidence=float(ai_result["confidence"]) if "confidence" in ai_result else None,
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)

    return AnalyzeResponse(district_id=data.district_id, analysis=insight)


@router.post("/simulate-action", response_model=SimulateActionResponse)
async def simulate_action(data: SimulateActionRequest, db: Session = Depends(get_db)):
    district = db.query(DistrictModel).filter_by(id=data.district_id).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")

    payload = {
        "district_id": district.id,
        "district_name": district.name,
        "action": data.action,
        "before_risk": district.risk_score,
        "before_complaints_count": district.complaints_count,
        "before_pollution": district.pollution_index,
        "before_traffic": district.traffic_index,
        "before_mood": district.mood_index,
    }

    ai_result = await ai_client.call_simulate_action(payload)

    action_rec = ActionModel(
        district_id=data.district_id,
        action_type="simulation",
        title=data.action[:255],
        description=ai_result.get("effect_summary", ""),
    )
    db.add(action_rec)
    db.flush()

    sim = SimulationResultModel(
        action_id=action_rec.id,
        before_risk=district.risk_score,
        after_risk=ai_result["after"]["risk"],
        before_mood=district.mood_index,
        after_mood=ai_result["after"]["mood_index"],
        before_traffic=district.traffic_index,
        after_traffic=ai_result["after"]["traffic"],
        before_pollution=district.pollution_index,
        after_pollution=ai_result["after"]["pollution"],
        effect_summary=ai_result.get("effect_summary", ""),
    )
    db.add(sim)
    db.commit()

    return SimulateActionResponse(
        district_id=ai_result["district_id"],
        action=ai_result["action"],
        before=SimulationBeforeAfter(**ai_result["before"]),
        after=SimulationBeforeAfter(**ai_result["after"]),
        effect_summary=ai_result["effect_summary"],
        city_status=ai_result["city_status"],
    )
