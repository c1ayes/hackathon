from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import District, RoadSegment


class DistrictRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_with_segment_counts(self) -> list[tuple[District, int]]:
        stmt = (
            select(District, func.count(RoadSegment.id))
            .outerjoin(RoadSegment, RoadSegment.district_id == District.id)
            .group_by(District.id)
            .order_by(District.id)
        )
        return list(self.db.execute(stmt).all())
