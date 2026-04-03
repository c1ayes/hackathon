from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ScenarioType = Literal["road_damage", "camera_gap", "combined"]
ActionType = Literal[
    "fix_now",
    "fix_this_quarter",
    "monitor",
    "install_camera",
    "increase_patrol",
    "infrastructure_change",
    "reallocate_budget",
]


class RecommendationRequest(BaseModel):
    scenario: ScenarioType = "combined"
    language: str = "ru"


class ActionResponse(BaseModel):
    id: int
    action_type: ActionType
    title: str
    description: str
    urgency: str
    location_label: str
    effect_text: str
    financial_impact: float
    risk_reduction: float
    time_horizon: str
    implementation_cost: float
    status: str

    model_config = ConfigDict(from_attributes=True)


class RecommendationResponse(BaseModel):
    id: int
    segment_id: int
    scenario_type: str
    summary: str
    priority_score: float
    prompt_version: str
    created_at: datetime
    actions: list[ActionResponse]

    model_config = ConfigDict(from_attributes=True)


class AIActionPayload(BaseModel):
    action_type: ActionType
    title: str
    description: str
    urgency: str
    location_label: str
    effect_text: str
    financial_impact: float
    risk_reduction: float
    time_horizon: str
    implementation_cost: float
    status: str = "suggested"


class AIRecommendationPayload(BaseModel):
    summary: str
    priority_score: float = Field(ge=0, le=100)
    actions: list[AIActionPayload]
