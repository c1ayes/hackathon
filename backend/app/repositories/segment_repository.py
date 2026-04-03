from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.db.models import Recommendation, RoadSegment


class SegmentRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_segments(self) -> list[RoadSegment]:
        stmt = (
            select(RoadSegment)
            .options(joinedload(RoadSegment.district), joinedload(RoadSegment.cameras))
            .order_by(RoadSegment.id)
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_segment(self, segment_id: int) -> RoadSegment | None:
        stmt = (
            select(RoadSegment)
            .where(RoadSegment.id == segment_id)
            .options(
                joinedload(RoadSegment.district),
                joinedload(RoadSegment.cameras),
                joinedload(RoadSegment.recommendations).joinedload(Recommendation.actions),
            )
        )
        return self.db.scalars(stmt).unique().one_or_none()

    def get_latest_recommendation(self, segment_id: int) -> Recommendation | None:
        stmt = (
            select(Recommendation)
            .where(Recommendation.segment_id == segment_id)
            .order_by(desc(Recommendation.created_at))
            .limit(1)
        )
        return self.db.scalars(stmt).first()
