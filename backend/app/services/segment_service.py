from fastapi import HTTPException, status

from app.repositories.segment_repository import SegmentRepository
from app.schemas.segment import CameraRead, SegmentDetailResponse


class SegmentService:
    def __init__(self, segment_repository: SegmentRepository) -> None:
        self.segment_repository = segment_repository

    def get_segment_detail(self, segment_id: int) -> SegmentDetailResponse:
        segment = self.segment_repository.get_segment(segment_id)
        if segment is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Segment not found")

        latest_recommendation = self.segment_repository.get_latest_recommendation(segment_id)
        return SegmentDetailResponse(
            id=segment.id,
            district_id=segment.district_id,
            district_name=segment.district.name,
            name=segment.name,
            road_class=segment.road_class,
            description=segment.description,
            risk_level=segment.risk_level,
            defect_score=segment.defect_score,
            traffic_volume=segment.traffic_volume,
            seasonal_decay_rate=segment.seasonal_decay_rate,
            estimated_fix_now_cost=segment.estimated_fix_now_cost,
            estimated_emergency_cost=segment.estimated_emergency_cost,
            camera_coverage_score=segment.camera_coverage_score,
            accident_risk_score=segment.accident_risk_score,
            center_lat=segment.center_lat,
            center_lng=segment.center_lng,
            cameras=[CameraRead.model_validate(camera) for camera in segment.cameras],
            latest_recommendation_id=latest_recommendation.id if latest_recommendation else None,
            updated_at=segment.updated_at,
        )
