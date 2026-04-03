from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.repositories.district_repository import DistrictRepository
from app.repositories.segment_repository import SegmentRepository
from app.schemas.city import CityOverviewResponse
from app.services.city_service import CityService


router = APIRouter(prefix="/city", tags=["city"])


@router.get("/overview", response_model=CityOverviewResponse)
def get_city_overview(db: Session = Depends(get_db)) -> CityOverviewResponse:
    service = CityService(
        district_repository=DistrictRepository(db),
        segment_repository=SegmentRepository(db),
    )
    return service.get_overview()
