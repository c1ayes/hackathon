from pydantic import BaseModel

class SimulateActionRequest(BaseModel):
    district_id: int
    action: str


class SimulationBeforeAfter(BaseModel):
    risk: float
    complaints_count: int
    pollution: float
    traffic: float
    mood_index: float


class SimulateActionResponse(BaseModel):
    district_id: int
    action: str
    before: SimulationBeforeAfter
    after: SimulationBeforeAfter
    effect_summary: str
    city_status: str