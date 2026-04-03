from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CameraRead(BaseModel):
    id: int
    location_name: str
    violation_count: int
    is_active: bool
    coverage_radius: float

    model_config = ConfigDict(from_attributes=True)


class SegmentDetailResponse(BaseModel):
    id: int
    district_id: int
    district_name: str
    name: str
    road_class: str
    description: str
    risk_level: str
    defect_score: float
    traffic_volume: int
    seasonal_decay_rate: float
    estimated_fix_now_cost: float
    estimated_emergency_cost: float
    camera_coverage_score: float
    accident_risk_score: float
    center_lat: float
    center_lng: float
    cameras: list[CameraRead]
    latest_recommendation_id: int | None
    updated_at: datetime
