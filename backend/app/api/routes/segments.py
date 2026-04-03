from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.repositories.segment_repository import SegmentRepository
from app.schemas.segment import SegmentDetailResponse
from app.services.segment_service import SegmentService


router = APIRouter(prefix="/segments", tags=["segments"])


@router.get("/{segment_id}", response_model=SegmentDetailResponse)
def get_segment(segment_id: int, db: Session = Depends(get_db)) -> SegmentDetailResponse:
    service = SegmentService(segment_repository=SegmentRepository(db))
    return service.get_segment_detail(segment_id)
