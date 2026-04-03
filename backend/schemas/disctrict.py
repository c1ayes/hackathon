from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

class DistrictBase(BaseModel):
    name: str
    slug: str
    status: str
    risk_score: float
    mood_index: float
    pollution_index: float
    traffic_index: float 
    complaints_count: int
    x: Optional[float] = None
    y: Optional[float] = None


class DistrictResponse(DistrictBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
