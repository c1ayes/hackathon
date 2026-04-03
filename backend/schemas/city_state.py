from schemas.disctrict import DistrictResponse
from schemas.report import ReportResponse
from pydantic import BaseModel

class CitySummaryResponse(BaseModel):
    total_complaints: int
    critical_districts: int
    mood_index: float


class CityStateResponse(BaseModel):
    city_status: str
    districts: list[DistrictResponse]
    complaints: list[ReportResponse]
    summary: CitySummaryResponse
