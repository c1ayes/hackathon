from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

class SimulationResultBase(BaseModel):
    before_risk: float
    after_risk: float
    before_mood: float
    after_mood: float
    before_traffic: float
    after_traffic: float
    before_pollution: float
    after_pollution: float
    effect_summary: Optional[str] = None


class SimulationResultCreate(SimulationResultBase):
    action_id: int


class SimulationResultResponse(SimulationResultBase):
    id: int
    action_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
