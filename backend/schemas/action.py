from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ActionBase(BaseModel):
    action_type: str
    title: str
    description: Optional[str] = None


class ActionCreate(ActionBase):
    district_id: int


class ActionResponse(ActionBase):
    id: int
    district_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)