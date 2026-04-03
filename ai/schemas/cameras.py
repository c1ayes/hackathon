from pydantic import BaseModel
from typing import Optional


class CamerasAnalyzeRequest(BaseModel):
    context: Optional[str] = None


class CamerasAnalyzeResponse(BaseModel):
    title: str
    summary: str
    top_priority_installs: list[str]
    projected_additional_revenue_tenge: Optional[int] = None
    recommendations: list[str]
    confidence: Optional[float] = None
