from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from dependencies import get_db
from models.models import (
    DistrictModel,
    ReportModel,
    AIInsightModel,
)
from schemas.ai_insight import AIInsightResponse
from schemas.analyze import AnalyzeRequest, AnalyzeResponse
from schemas.city_state import CityStateResponse, CitySummaryResponse
from schemas.simulate_action import (
    SimulateActionRequest,
    SimulateActionResponse,
    SimulationBeforeAfter,
)

router = APIRouter(prefix="/city", tags=["City"])



@router.get("/state", response_model=CityStateResponse)
def get_city_state(db: Session = Depends(get_db)):
    return


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_district(data: AnalyzeRequest, db: Session = Depends(get_db)):
    return 


@router.post("/simulate-action", response_model=SimulateActionResponse)
def simulate_action(data: SimulateActionRequest, db: Session = Depends(get_db)):
    return
