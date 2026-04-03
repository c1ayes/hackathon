from pydantic import BaseModel, ConfigDict


class DistrictOverview(BaseModel):
    id: int
    name: str
    budget_total: float
    budget_available: float
    segment_count: int

    model_config = ConfigDict(from_attributes=True)


class SegmentMapItem(BaseModel):
    id: int
    district_id: int
    district_name: str
    name: str
    risk_level: str
    defect_score: float
    traffic_volume: int
    camera_coverage_score: float
    accident_risk_score: float
    center_lat: float
    center_lng: float


class CityOverviewTotals(BaseModel):
    districts: int
    segments: int
    red_segments: int
    low_camera_coverage_segments: int


class CityOverviewResponse(BaseModel):
    city: str
    districts: list[DistrictOverview]
    segments: list[SegmentMapItem]
    totals: CityOverviewTotals
