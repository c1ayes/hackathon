from pydantic import BaseModel
from typing import Optional


class RoadsAnalyzeRequest(BaseModel):
    context: Optional[str] = None


class RoadsAnalyzeResponse(BaseModel):
    title: str
    summary: str
    top_priority_segments: list[str]
    total_savings_if_fixed_now_tenge: Optional[int] = None
    recommendations: list[str]
    confidence: Optional[float] = None
