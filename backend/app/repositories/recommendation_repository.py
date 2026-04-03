from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.db.models import ActionForecast, Recommendation, RecommendedAction


class RecommendationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_recommendation(self, recommendation: Recommendation) -> Recommendation:
        self.db.add(recommendation)
        self.db.commit()
        self.db.refresh(recommendation)
        return recommendation

    def get_action(self, action_id: int) -> RecommendedAction | None:
        stmt = (
            select(RecommendedAction)
            .where(RecommendedAction.id == action_id)
            .options(
                joinedload(RecommendedAction.recommendation).joinedload(Recommendation.segment),
                joinedload(RecommendedAction.forecasts),
            )
        )
        return self.db.scalars(stmt).unique().one_or_none()

    def create_forecast(self, forecast: ActionForecast) -> ActionForecast:
        self.db.add(forecast)
        self.db.commit()
        self.db.refresh(forecast)
        return forecast
