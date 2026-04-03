from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ForecastRequest(BaseModel):
    notes: str | None = None


class ForecastResponse(BaseModel):
    id: int
    recommended_action_id: int
    selected_by_user: bool
    forecast_summary: str
    projected_savings: float
    projected_revenue: float
    projected_accident_reduction: float
    projected_risk_change: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
