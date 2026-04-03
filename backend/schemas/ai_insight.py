from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

class AIInsightBase(BaseModel):
    title: str
    summary: str
    possible_cause: Optional[str] = None
    forecast: Optional[str] = None
    recommendations: Optional[list[str]] = None
    confidence: Optional[float] = None


class AIInsightCreate(AIInsightBase):
    district_id: int


class AIInsightResponse(AIInsightBase):
    id: int
    district_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)