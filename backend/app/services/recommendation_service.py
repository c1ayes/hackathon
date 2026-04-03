from fastapi import HTTPException, status

from app.core.config import settings
from app.db.models import Recommendation, RecommendedAction
from app.repositories.recommendation_repository import RecommendationRepository
from app.repositories.segment_repository import SegmentRepository
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.ai_service import AIService
from app.services.prompt_service import PromptService


class RecommendationService:
    def __init__(
        self,
        segment_repository: SegmentRepository,
        recommendation_repository: RecommendationRepository,
        prompt_service: PromptService,
        ai_service: AIService,
    ) -> None:
        self.segment_repository = segment_repository
        self.recommendation_repository = recommendation_repository
        self.prompt_service = prompt_service
        self.ai_service = ai_service

    async def create_recommendation(
        self, segment_id: int, request: RecommendationRequest
    ) -> RecommendationResponse:
        segment = self.segment_repository.get_segment(segment_id)
        if segment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Segment not found")

        prompt = self.prompt_service.build_recommendation_prompt(segment, request.scenario, request.language)
        ai_payload, raw_response = await self.ai_service.generate_recommendations(
            segment=segment,
            scenario=request.scenario,
            language=request.language,
        )

        recommendation = Recommendation(
            segment_id=segment.id,
            scenario_type=request.scenario,
            summary=ai_payload.summary,
            priority_score=ai_payload.priority_score,
            prompt_version=settings.prompt_version,
            raw_prompt=prompt,
            raw_ai_response=raw_response,
            actions=[
                RecommendedAction(
                    action_type=action.action_type,
                    title=action.title,
                    description=action.description,
                    urgency=action.urgency,
                    location_label=action.location_label,
                    effect_text=action.effect_text,
                    financial_impact=action.financial_impact,
                    risk_reduction=action.risk_reduction,
                    time_horizon=action.time_horizon,
                    implementation_cost=action.implementation_cost,
                    status=action.status,
                )
                for action in ai_payload.actions
            ],
        )
        saved = self.recommendation_repository.create_recommendation(recommendation)
        return RecommendationResponse.model_validate(saved)
