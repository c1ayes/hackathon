from pydantic import BaseModel
from typing import Optional


class ReportItem(BaseModel):
    category: str
    source: str
    severity_score: float
    text: str


class DistrictAnalyzeRequest(BaseModel):
    district_id: int
    name: str
    risk_score: float
    mood_index: float
    pollution_index: float
    traffic_index: float
    complaints_count: int
    reports: list[ReportItem] = []


class DistrictAnalyzeResponse(BaseModel):
    title: str
    summary: str
    possible_cause: Optional[str] = None
    forecast: Optional[str] = None
    recommendations: Optional[list[str]] = None
    confidence: Optional[float] = None


class SimulateRequest(BaseModel):
    district_id: int
    district_name: str
    action: str
    before_risk: float
    before_complaints_count: int
    before_pollution: float
    before_traffic: float
    before_mood: float


class SimulationMetrics(BaseModel):
    risk: float
    complaints_count: int
    pollution: float
    traffic: float
    mood_index: float


class SimulateResponse(BaseModel):
    district_id: int
    action: str
    before: SimulationMetrics
    after: SimulationMetrics
    effect_summary: str
    city_status: str
