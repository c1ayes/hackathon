from fastapi import HTTPException, status

from app.db.models import ActionForecast
from app.repositories.recommendation_repository import RecommendationRepository
from app.schemas.forecast import ForecastRequest, ForecastResponse
from app.services.ai_service import AIService
from app.services.prompt_service import PromptService


class ForecastService:
    def __init__(
        self,
        recommendation_repository: RecommendationRepository,
        prompt_service: PromptService,
        ai_service: AIService,
    ) -> None:
        self.recommendation_repository = recommendation_repository
        self.prompt_service = prompt_service
        self.ai_service = ai_service

    def create_forecast(self, action_id: int, request: ForecastRequest) -> ForecastResponse:
        action = self.recommendation_repository.get_action(action_id)
        if action is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")

        self.prompt_service.build_forecast_prompt(action.title, request.notes)
        payload, raw_response = self.ai_service.generate_forecast(
            action=action,
            segment=action.recommendation.segment,
            notes=request.notes,
        )

        forecast = ActionForecast(
            recommended_action_id=action.id,
            selected_by_user=True,
            forecast_summary=str(payload["forecast_summary"]),
            projected_savings=float(payload["projected_savings"]),
            projected_revenue=float(payload["projected_revenue"]),
            projected_accident_reduction=float(payload["projected_accident_reduction"]),
            projected_risk_change=float(payload["projected_risk_change"]),
            raw_ai_response=raw_response,
        )
        saved = self.recommendation_repository.create_forecast(forecast)
        return ForecastResponse.model_validate(saved)
