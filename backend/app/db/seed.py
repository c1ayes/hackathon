import random

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Camera, District, RoadSegment


CITY_SEED = 42

DISTRICT_SPECS = [
    {"name": "Alatau District", "budget_total": 900_000_000, "budget_available": 320_000_000},
    {"name": "Bostandyk District", "budget_total": 1_200_000_000, "budget_available": 410_000_000},
    {"name": "Auezov District", "budget_total": 1_050_000_000, "budget_available": 360_000_000},
    {"name": "Medeu District", "budget_total": 1_350_000_000, "budget_available": 470_000_000},
    {"name": "Nauryzbay District", "budget_total": 840_000_000, "budget_available": 290_000_000},
    {"name": "Turksib District", "budget_total": 980_000_000, "budget_available": 305_000_000},
    {"name": "Zhetysu District", "budget_total": 870_000_000, "budget_available": 275_000_000},
    {"name": "Almaly District", "budget_total": 1_150_000_000, "budget_available": 395_000_000},
]

ROAD_CLASS_SPECS = {
    "arterial": {
        "traffic": (32000, 62000),
        "fix_now": (13_000_000, 26_000_000),
        "camera_bonus": 0.08,
    },
    "collector": {
        "traffic": (18000, 36000),
        "fix_now": (9_000_000, 19_000_000),
        "camera_bonus": 0.0,
    },
    "local": {
        "traffic": (6000, 18000),
        "fix_now": (4_000_000, 11_000_000),
        "camera_bonus": -0.08,
    },
}

STREET_PREFIXES = [
    "Abay",
    "Satpayev",
    "Ryskulov",
    "Al-Farabi",
    "Tole Bi",
    "Nazarbayev",
    "Dostyk",
    "Sain",
    "Momyshuly",
    "Seifullin",
    "Raiymbek",
    "Zhandosov",
    "Aimanov",
    "Tlendiev",
]

STREET_SUFFIXES = [
    "Junction",
    "Underpass",
    "Bridge Approach",
    "Eastbound Corridor",
    "Northbound Stretch",
    "Bus Lane Segment",
    "Market Access",
    "School Frontage",
    "Depot Access",
    "River Crossing",
]

SHOWCASE_SEGMENTS = [
    {
        "district": "Alatau District",
        "name": "Abay Ave - Seifullin Junction",
        "road_class": "arterial",
        "center_lat": 43.2567,
        "center_lng": 76.9286,
        "risk_level": "red",
        "defect_score": 89.0,
        "traffic_volume": 48000,
        "seasonal_decay_rate": 0.78,
        "estimated_fix_now_cost": 12_000_000,
        "estimated_emergency_cost": 80_000_000,
        "camera_coverage_score": 0.35,
        "accident_risk_score": 0.74,
        "description": "High-load arterial segment with freeze-thaw cracking and weak camera coverage.",
        "cameras": [
            {
                "location_name": "Seifullin northbound pole",
                "violation_count": 1540,
                "is_active": True,
                "coverage_radius": 250.0,
            }
        ],
    },
    {
        "district": "Auezov District",
        "name": "Ryskulov Ave - Momyshuly Gap",
        "road_class": "collector",
        "center_lat": 43.2455,
        "center_lng": 76.8421,
        "risk_level": "orange",
        "defect_score": 66.0,
        "traffic_volume": 26500,
        "seasonal_decay_rate": 0.54,
        "estimated_fix_now_cost": 18_000_000,
        "estimated_emergency_cost": 52_000_000,
        "camera_coverage_score": 0.22,
        "accident_risk_score": 0.69,
        "description": "Uneven surface with recurrent potholes and a vulnerable camera gap.",
        "cameras": [
            {
                "location_name": "Ryskulov west approach",
                "violation_count": 920,
                "is_active": False,
                "coverage_radius": 180.0,
            }
        ],
    },
    {
        "district": "Bostandyk District",
        "name": "Al-Farabi Ave - River Crossing",
        "road_class": "arterial",
        "center_lat": 43.2199,
        "center_lng": 76.9157,
        "risk_level": "green",
        "defect_score": 38.0,
        "traffic_volume": 52000,
        "seasonal_decay_rate": 0.31,
        "estimated_fix_now_cost": 15_000_000,
        "estimated_emergency_cost": 29_000_000,
        "camera_coverage_score": 0.81,
        "accident_risk_score": 0.28,
        "description": "Stable segment with moderate wear and good enforcement coverage.",
        "cameras": [
            {
                "location_name": "River crossing gantry",
                "violation_count": 2330,
                "is_active": True,
                "coverage_radius": 320.0,
            }
        ],
    },
    {
        "district": "Medeu District",
        "name": "Dostyk Ave - School Frontage",
        "road_class": "local",
        "center_lat": 43.2398,
        "center_lng": 76.9561,
        "risk_level": "red",
        "defect_score": 78.0,
        "traffic_volume": 14600,
        "seasonal_decay_rate": 0.71,
        "estimated_fix_now_cost": 8_600_000,
        "estimated_emergency_cost": 31_000_000,
        "camera_coverage_score": 0.18,
        "accident_risk_score": 0.81,
        "description": "School-adjacent segment with high incident exposure and almost no active camera control.",
        "cameras": [],
    },
]


def seed_database(db: Session) -> None:
    if db.scalar(select(District.id).limit(1)):
        return

    rng = random.Random(CITY_SEED)
    district_map = _seed_districts(db)
    _seed_showcase_segments(db, district_map)
    _seed_generated_segments(db, district_map, rng, segments_per_district=18)
    db.commit()


def _seed_districts(db: Session) -> dict[str, District]:
    districts = [District(**district_spec) for district_spec in DISTRICT_SPECS]
    db.add_all(districts)
    db.flush()
    return {district.name: district for district in districts}


def _seed_showcase_segments(db: Session, district_map: dict[str, District]) -> None:
    for showcase_segment in SHOWCASE_SEGMENTS:
        segment_payload = showcase_segment.copy()
        camera_payloads = segment_payload.pop("cameras")
        district = district_map[segment_payload.pop("district")]
        segment = RoadSegment(district_id=district.id, **segment_payload)
        db.add(segment)
        db.flush()
        _create_cameras(db, segment.id, camera_payloads)


def _seed_generated_segments(
    db: Session,
    district_map: dict[str, District],
    rng: random.Random,
    segments_per_district: int,
) -> None:
    for district_index, district in enumerate(district_map.values()):
        for segment_index in range(segments_per_district):
            road_class = _pick_road_class(rng)
            spec = ROAD_CLASS_SPECS[road_class]
            traffic_volume = rng.randint(*spec["traffic"])
            seasonal_decay_rate = round(rng.uniform(0.22, 0.84), 2)

            base_defect = 22 + (traffic_volume / spec["traffic"][1]) * 42 + seasonal_decay_rate * 26
            defect_score = round(min(max(base_defect + rng.uniform(-11, 14), 12), 97), 1)

            camera_coverage_score = round(
                min(
                    max(
                        rng.uniform(0.12, 0.9)
                        + spec["camera_bonus"]
                        - (0.08 if defect_score > 75 else 0.0),
                        0.05,
                    ),
                    0.95,
                ),
                2,
            )

            accident_risk_score = round(
                min(
                    max(
                        0.18
                        + (defect_score / 100) * 0.35
                        + (traffic_volume / spec["traffic"][1]) * 0.22
                        + (1 - camera_coverage_score) * 0.28
                        + rng.uniform(-0.08, 0.1),
                        0.08,
                    ),
                    0.96,
                ),
                2,
            )

            risk_level = _risk_level(defect_score, accident_risk_score, camera_coverage_score)
            implementation_cost = rng.randint(*spec["fix_now"])
            emergency_multiplier = 1.8 + (defect_score / 100) * 2.2 + (traffic_volume / spec["traffic"][1]) * 0.6
            estimated_emergency_cost = round(implementation_cost * emergency_multiplier, 2)

            center_lat, center_lng = _segment_coordinates(district_index, segment_index, rng)
            segment = RoadSegment(
                district_id=district.id,
                name=_segment_name(district_index, segment_index),
                road_class=road_class,
                center_lat=center_lat,
                center_lng=center_lng,
                risk_level=risk_level,
                defect_score=defect_score,
                traffic_volume=traffic_volume,
                seasonal_decay_rate=seasonal_decay_rate,
                estimated_fix_now_cost=float(implementation_cost),
                estimated_emergency_cost=float(estimated_emergency_cost),
                camera_coverage_score=camera_coverage_score,
                accident_risk_score=accident_risk_score,
                description=_description_for_segment(risk_level, road_class, camera_coverage_score),
            )
            db.add(segment)
            db.flush()
            _create_cameras(db, segment.id, _generated_cameras(segment.name, camera_coverage_score, rng))


def _pick_road_class(rng: random.Random) -> str:
    value = rng.random()
    if value < 0.28:
        return "arterial"
    if value < 0.68:
        return "collector"
    return "local"


def _risk_level(defect_score: float, accident_risk_score: float, camera_coverage_score: float) -> str:
    if defect_score >= 78 or (accident_risk_score >= 0.72 and camera_coverage_score < 0.45):
        return "red"
    if defect_score >= 52 or accident_risk_score >= 0.48:
        return "orange"
    return "green"


def _segment_coordinates(
    district_index: int, segment_index: int, rng: random.Random
) -> tuple[float, float]:
    base_lat = 43.18 + district_index * 0.012
    base_lng = 76.78 + district_index * 0.018
    lat = round(base_lat + (segment_index % 6) * 0.004 + rng.uniform(-0.0013, 0.0013), 6)
    lng = round(base_lng + (segment_index // 6) * 0.006 + rng.uniform(-0.0015, 0.0015), 6)
    return lat, lng


def _segment_name(district_index: int, segment_index: int) -> str:
    left = STREET_PREFIXES[(district_index * 3 + segment_index) % len(STREET_PREFIXES)]
    right = STREET_SUFFIXES[(district_index * 5 + segment_index) % len(STREET_SUFFIXES)]
    return f"{left} - {right} {segment_index + 1}"


def _description_for_segment(risk_level: str, road_class: str, camera_coverage_score: float) -> str:
    coverage_note = (
        "thin enforcement coverage"
        if camera_coverage_score < 0.35
        else "moderate enforcement visibility"
        if camera_coverage_score < 0.65
        else "strong enforcement presence"
    )
    risk_note = {
        "red": "Critical deterioration pressure with immediate budget implications.",
        "orange": "Rising wear that should be scheduled before the next damage cycle.",
        "green": "Stable operating condition with manageable maintenance pressure.",
    }[risk_level]
    return f"{risk_note} {road_class.capitalize()} road segment with {coverage_note}."


def _generated_cameras(
    segment_name: str, camera_coverage_score: float, rng: random.Random
) -> list[dict[str, object]]:
    if camera_coverage_score < 0.22:
        return []

    count = 1 if camera_coverage_score < 0.68 else 2
    cameras: list[dict[str, object]] = []
    for index in range(count):
        cameras.append(
            {
                "location_name": f"{segment_name} camera point {index + 1}",
                "violation_count": rng.randint(340, 2800),
                "is_active": rng.random() > 0.14,
                "coverage_radius": float(rng.randint(160, 340)),
            }
        )
    return cameras


def _create_cameras(db: Session, segment_id: int, cameras: list[dict[str, object]]) -> None:
    if not cameras:
        return

    db.add_all([Camera(segment_id=segment_id, **camera) for camera in cameras])
