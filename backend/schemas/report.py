from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

class ReportBase(BaseModel):
    source: str
    district_id: int
    category: str
    text: str
    sentiment_score: Optional[float] = None
    severity_score: Optional[float] = None
    source_url: Optional[str] = None
    is_processed: bool = False


class ReportCreate(ReportBase):
    pass


class ReportResponse(ReportBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)