from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.repositories.recommendation_repository import RecommendationRepository
from app.repositories.segment_repository import SegmentRepository
from app.schemas.forecast import ForecastRequest, ForecastResponse
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.ai_service import AIService
from app.services.forecast_service import ForecastService
from app.services.prompt_service import PromptService
from app.services.recommendation_service import RecommendationService


router = APIRouter(tags=["recommendations"])


@router.post("/segments/{segment_id}/recommendations", response_model=RecommendationResponse)
def create_recommendation(
    segment_id: int,
    request: RecommendationRequest,
    db: Session = Depends(get_db),
) -> RecommendationResponse:
    service = RecommendationService(
        segment_repository=SegmentRepository(db),
        recommendation_repository=RecommendationRepository(db),
        prompt_service=PromptService(),
        ai_service=AIService(),
    )
    return service.create_recommendation(segment_id, request)


@router.post("/recommendations/{action_id}/forecast", response_model=ForecastResponse)
def create_forecast(
    action_id: int,
    request: ForecastRequest,
    db: Session = Depends(get_db),
) -> ForecastResponse:
    service = ForecastService(
        recommendation_repository=RecommendationRepository(db),
        prompt_service=PromptService(),
        ai_service=AIService(),
    )
    return service.create_forecast(action_id, request)
