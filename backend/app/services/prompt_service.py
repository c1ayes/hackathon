import json

from app.db.models import RoadSegment


class PromptService:
    def build_recommendation_prompt(self, segment: RoadSegment, scenario: str, language: str) -> str:
        payload = {
            "task": "Generate concrete budget optimization actions for a road segment.",
            "language": language,
            "scenario": scenario,
            "segment": {
                "id": segment.id,
                "name": segment.name,
                "district": segment.district.name,
                "risk_level": segment.risk_level,
                "road_class": segment.road_class,
                "defect_score": segment.defect_score,
                "traffic_volume": segment.traffic_volume,
                "seasonal_decay_rate": segment.seasonal_decay_rate,
                "estimated_fix_now_cost": segment.estimated_fix_now_cost,
                "estimated_emergency_cost": segment.estimated_emergency_cost,
                "camera_coverage_score": segment.camera_coverage_score,
                "accident_risk_score": segment.accident_risk_score,
                "active_cameras": len([camera for camera in segment.cameras if camera.is_active]),
            },
        }
        return json.dumps(payload, ensure_ascii=False, indent=2)

    def build_forecast_prompt(self, action_title: str, notes: str | None = None) -> str:
        payload = {
            "task": "Forecast the impact of the selected road action.",
            "selected_action": action_title,
            "notes": notes or "",
        }
        return json.dumps(payload, ensure_ascii=False, indent=2)
