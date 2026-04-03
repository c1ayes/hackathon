from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

class DistrictSnapshotResponse(BaseModel):
    id: int
    district_id: int
    complaints_count: int
    negative_reports_count: int
    traffic_index: float
    pollution_index: float
    risk_score: float
    mood_index: float
    top_category: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
