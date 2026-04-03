from schemas.ai_insight import AIInsightResponse
from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    district_id: int


class AnalyzeResponse(BaseModel):
    district_id: int
    analysis: AIInsightResponse
