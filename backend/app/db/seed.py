from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Camera, District, RoadSegment


def seed_database(db: Session) -> None:
    if db.scalar(select(District.id).limit(1)):
        return

    alatau = District(name="Alatau District", budget_total=900_000_000, budget_available=320_000_000)
    bostandyk = District(
        name="Bostandyk District", budget_total=1_200_000_000, budget_available=410_000_000
    )
    db.add_all([alatau, bostandyk])
    db.flush()

    segments = [
        RoadSegment(
            district_id=alatau.id,
            name="Abay Ave - Seifullin Junction",
            road_class="arterial",
            center_lat=43.2567,
            center_lng=76.9286,
            risk_level="red",
            defect_score=89.0,
            traffic_volume=48000,
            seasonal_decay_rate=0.78,
            estimated_fix_now_cost=12_000_000,
            estimated_emergency_cost=80_000_000,
            camera_coverage_score=0.35,
            accident_risk_score=0.74,
            description="High-load arterial segment with freeze-thaw cracking and weak camera coverage.",
        ),
        RoadSegment(
            district_id=alatau.id,
            name="Ryskulov Ave - Momyshuly",
            road_class="collector",
            center_lat=43.2455,
            center_lng=76.8421,
            risk_level="orange",
            defect_score=66.0,
            traffic_volume=26500,
            seasonal_decay_rate=0.54,
            estimated_fix_now_cost=18_000_000,
            estimated_emergency_cost=52_000_000,
            camera_coverage_score=0.22,
            accident_risk_score=0.69,
            description="Uneven surface with recurrent potholes and a vulnerable camera gap.",
        ),
        RoadSegment(
            district_id=bostandyk.id,
            name="Al-Farabi Ave - River Crossing",
            road_class="arterial",
            center_lat=43.2199,
            center_lng=76.9157,
            risk_level="green",
            defect_score=38.0,
            traffic_volume=52000,
            seasonal_decay_rate=0.31,
            estimated_fix_now_cost=15_000_000,
            estimated_emergency_cost=29_000_000,
            camera_coverage_score=0.81,
            accident_risk_score=0.28,
            description="Stable segment with moderate wear and good enforcement coverage.",
        ),
    ]
    db.add_all(segments)
    db.flush()

    db.add_all(
        [
            Camera(
                segment_id=segments[0].id,
                location_name="Seifullin northbound pole",
                violation_count=1540,
                is_active=True,
                coverage_radius=250.0,
            ),
            Camera(
                segment_id=segments[1].id,
                location_name="Ryskulov west approach",
                violation_count=920,
                is_active=False,
                coverage_radius=180.0,
            ),
            Camera(
                segment_id=segments[2].id,
                location_name="River crossing gantry",
                violation_count=2330,
                is_active=True,
                coverage_radius=320.0,
            ),
        ]
    )
    db.commit()
