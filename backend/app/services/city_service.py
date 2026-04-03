from app.repositories.district_repository import DistrictRepository
from app.repositories.segment_repository import SegmentRepository
from app.schemas.city import (
    CityOverviewResponse,
    CityOverviewTotals,
    DistrictOverview,
    SegmentMapItem,
)


class CityService:
    def __init__(
        self, district_repository: DistrictRepository, segment_repository: SegmentRepository
    ) -> None:
        self.district_repository = district_repository
        self.segment_repository = segment_repository

    def get_overview(self) -> CityOverviewResponse:
        district_rows = self.district_repository.list_with_segment_counts()
        segments = self.segment_repository.list_segments()

        districts = [
            DistrictOverview(
                id=district.id,
                name=district.name,
                budget_total=district.budget_total,
                budget_available=district.budget_available,
                segment_count=segment_count,
            )
            for district, segment_count in district_rows
        ]
        segment_items = [
            SegmentMapItem(
                id=segment.id,
                district_id=segment.district_id,
                district_name=segment.district.name,
                name=segment.name,
                risk_level=segment.risk_level,
                defect_score=segment.defect_score,
                traffic_volume=segment.traffic_volume,
                camera_coverage_score=segment.camera_coverage_score,
                accident_risk_score=segment.accident_risk_score,
                center_lat=segment.center_lat,
                center_lng=segment.center_lng,
            )
            for segment in segments
        ]
        totals = CityOverviewTotals(
            districts=len(districts),
            segments=len(segment_items),
            red_segments=sum(1 for segment in segments if segment.risk_level == "red"),
            low_camera_coverage_segments=sum(
                1 for segment in segments if segment.camera_coverage_score < 0.5
            ),
        )
        return CityOverviewResponse(city="Almaty", districts=districts, segments=segment_items, totals=totals)
