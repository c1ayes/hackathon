from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from dependencies import get_db
from models.models import (
    DistrictModel,
    ReportModel,
)
from schemas.analyze import AnalyzeRequest, AnalyzeResponse
from schemas.city_state import CityStateResponse, CitySummaryResponse
from schemas.simulate_action import (
    SimulateActionRequest,
    SimulateActionResponse,
)
from services.analyze import analyze_district as svc_analyze, simulate_action as svc_simulate

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
def analyze_district(data: AnalyzeRequest, db: Session = Depends(get_db)):
    if not db.query(DistrictModel).filter_by(id=data.district_id).first():
        raise HTTPException(status_code=404, detail="District not found")
    insight = svc_analyze(data.district_id, db)
    return AnalyzeResponse(district_id=data.district_id, analysis=insight)


@router.post("/simulate-action", response_model=SimulateActionResponse)
def simulate_action(data: SimulateActionRequest, db: Session = Depends(get_db)):
    if not db.query(DistrictModel).filter_by(id=data.district_id).first():
        raise HTTPException(status_code=404, detail="District not found")
    result = svc_simulate(data.district_id, data.action, db)
    return SimulateActionResponse(**result)
