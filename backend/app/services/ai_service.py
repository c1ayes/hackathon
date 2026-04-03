import json
from typing import Any

from app.core.config import settings
from app.db.models import RecommendedAction, RoadSegment
from app.schemas.recommendation import AIActionPayload, AIRecommendationPayload
from app.services.ai_client import call_analyze_district, call_simulate_action


class AIService:
    async def generate_recommendations(
        self,
        segment: RoadSegment,
        scenario: str,
        language: str = "ru",
    ) -> tuple[AIRecommendationPayload, str]:
        if settings.ai_provider == "mock":
            return self._generate_mock_recommendations(segment, scenario)

        payload = self._build_district_payload(segment, scenario, language)
        response = await call_analyze_district(payload)
        action_texts = response.get("recommendations")
        actions = self._build_actions_from_ai(
            segment=segment,
            scenario=scenario,
            action_texts=action_texts if isinstance(action_texts, list) else [],
        )
        if not actions:
            return self._generate_mock_recommendations(segment, scenario)

        ai_payload = AIRecommendationPayload(
            summary=self._normalize_text(
                str(response.get("summary") or f"Участок {segment.name} требует внимания.")
            ),
            priority_score=self._priority_score(segment),
            actions=actions,
        )
        return ai_payload, json.dumps(response, ensure_ascii=False)

    async def generate_forecast(
        self, action: RecommendedAction, segment: RoadSegment, notes: str | None = None
    ) -> tuple[dict[str, float | str], str]:
        if settings.ai_provider == "mock":
            return self._generate_mock_forecast(action, segment, notes)

        payload = self._build_simulation_payload(segment, action, notes)
        response = await call_simulate_action(payload)
        before = response.get("before") or {}
        after = response.get("after") or {}
        before_risk = self._safe_float(before.get("risk"), self._risk_score(segment))
        after_risk = self._safe_float(after.get("risk"), max(before_risk - 0.1, 0.0))
        before_complaints = self._safe_float(before.get("complaints_count"), self._complaints_count(segment))
        after_complaints = self._safe_float(after.get("complaints_count"), max(before_complaints - 1, 0.0))

        payload_out = {
            "forecast_summary": self._normalize_text(
                response.get("effect_summary")
                or f"Выбранное действие '{action.title}' улучшает ситуацию на участке {segment.name}."
            ),
            "projected_savings": round(max(action.financial_impact, 0.0), 2),
            "projected_revenue": round(
                action.financial_impact * 0.22 if action.action_type in {"install_camera", "increase_patrol"} else 0.0,
                2,
            ),
            "projected_accident_reduction": round(max((before_complaints - after_complaints) * 0.5, 0.2), 2),
            "projected_risk_change": round(after_risk - before_risk, 2),
        }
        return payload_out, json.dumps(response, ensure_ascii=False)

    def _build_district_payload(self, segment: RoadSegment, scenario: str, language: str) -> dict[str, Any]:
        reports = [
            {
                "category": "roads",
                "source": "backend.segment",
                "severity_score": round(segment.defect_score / 100, 2),
                "text": segment.description,
            }
        ]
        if segment.camera_coverage_score < 0.75:
            reports.append(
                {
                    "category": "safety",
                    "source": "backend.cameras",
                    "severity_score": round(1 - segment.camera_coverage_score, 2),
                    "text": f"Обнаружен пробел в покрытии камерами на участке {segment.name}.",
                }
            )
        if scenario == "camera_gap":
            reports.append(
                {
                    "category": "scenario",
                    "source": "backend.request",
                    "severity_score": round(segment.accident_risk_score, 2),
                    "text": f"Приоритет: безопасность дорожного движения и контроль. Язык ответа: {language}.",
                }
            )

        return {
            "district_id": segment.district_id,
            "name": segment.district.name,
            "risk_score": self._risk_score(segment),
            "mood_index": self._mood_index(segment),
            "pollution_index": self._pollution_index(segment),
            "traffic_index": self._traffic_index(segment),
            "complaints_count": self._complaints_count(segment),
            "reports": reports,
        }

    def _build_simulation_payload(
        self,
        segment: RoadSegment,
        action: RecommendedAction,
        notes: str | None,
    ) -> dict[str, Any]:
        action_text = action.title if not notes else f"{action.title}. Примечание: {notes}"
        return {
            "district_id": segment.district_id,
            "district_name": segment.district.name,
            "action": action_text,
            "before_risk": self._risk_score(segment),
            "before_complaints_count": self._complaints_count(segment),
            "before_pollution": self._pollution_index(segment),
            "before_traffic": self._traffic_index(segment),
            "before_mood": self._mood_index(segment),
        }

    def _build_actions_from_ai(
        self,
        segment: RoadSegment,
        scenario: str,
        action_texts: list[str],
    ) -> list[AIActionPayload]:
        actions: list[AIActionPayload] = []
        road_pressure = (segment.defect_score / 100) * 0.55 + segment.seasonal_decay_rate * 0.45
        safety_gap = (1 - segment.camera_coverage_score) * 0.6 + segment.accident_risk_score * 0.4
        savings = max(segment.estimated_emergency_cost - segment.estimated_fix_now_cost, 0.0)

        for text in action_texts[:3]:
            normalized = text.lower()
            action_type = "reallocate_budget"
            implementation_cost = 0.0
            risk_reduction = round(min(0.2 + (road_pressure + safety_gap) * 0.12, 0.55), 2)
            financial_impact = round(savings, 2)

            if scenario != "camera_gap" and any(word in normalized for word in ["repair", "fix", "road", "pothole"]):
                action_type = "fix_now" if segment.risk_level == "red" else "fix_this_quarter"
                implementation_cost = segment.estimated_fix_now_cost
                risk_reduction = round(min(0.62 + road_pressure * 0.2, 0.95), 2)
            elif any(word in normalized for word in ["camera", "surveillance", "coverage"]):
                action_type = "install_camera"
                implementation_cost = 18_000_000.0
                risk_reduction = round(min(0.25 + safety_gap * 0.35, 0.7), 2)
                financial_impact = round((1 - segment.camera_coverage_score) * 24_000_000, 2)
            elif any(word in normalized for word in ["patrol", "enforcement", "police"]):
                action_type = "increase_patrol"
                implementation_cost = 4_500_000.0
                risk_reduction = round(min(0.14 + safety_gap * 0.18, 0.45), 2)
                financial_impact = round((1 - segment.camera_coverage_score) * 7_500_000, 2)
            elif any(word in normalized for word in ["monitor", "inspect", "audit"]):
                action_type = "monitor"
                implementation_cost = round(segment.estimated_fix_now_cost * 0.08, 2)
                risk_reduction = round(max(0.12, road_pressure * 0.18), 2)
                financial_impact = round(segment.estimated_fix_now_cost * 0.18, 2)

            actions.append(
                AIActionPayload(
                    action_type=action_type,
                    title=self._title_from_text(text, segment.name),
                    description=self._normalize_text(text),
                    urgency=self._urgency_for_action(action_type, segment),
                    location_label=segment.name,
                    effect_text=self._normalize_text(text),
                    financial_impact=financial_impact,
                    risk_reduction=risk_reduction,
                    time_horizon=self._time_horizon_for_action(action_type),
                    implementation_cost=implementation_cost,
                )
            )

        if scenario in {"road_damage", "combined"} and not any(
            action.action_type in {"fix_now", "fix_this_quarter"} for action in actions
        ):
            actions.insert(
                0,
                AIActionPayload(
                    action_type="fix_now" if segment.risk_level == "red" else "fix_this_quarter",
                    title=f"Отремонтировать {segment.name}",
                    description="Провести превентивный ремонт дороги до ускорения деградации покрытия.",
                    urgency=self._urgency_for_action("fix_now", segment),
                    location_label=segment.name,
                    effect_text="Снизить риск разрушения дороги и избежать затрат на аварийный ремонт.",
                    financial_impact=round(savings, 2),
                    risk_reduction=round(min(0.62 + road_pressure * 0.2, 0.95), 2),
                    time_horizon=self._time_horizon_for_action("fix_now"),
                    implementation_cost=segment.estimated_fix_now_cost,
                )
            )

        if scenario in {"camera_gap", "combined"} and segment.camera_coverage_score < 0.75 and not any(
            action.action_type == "install_camera" for action in actions
        ):
            actions.append(
                AIActionPayload(
                    action_type="install_camera",
                    title=f"Установить камеру на {segment.name}",
                    description="Закрыть пробел в покрытии камерами на этом участке.",
                    urgency=self._urgency_for_action("install_camera", segment),
                    location_label=segment.name,
                    effect_text="Повысить наблюдаемость и создать дополнительный поток штрафных поступлений.",
                    financial_impact=round((1 - segment.camera_coverage_score) * 24_000_000, 2),
                    risk_reduction=round(min(0.25 + safety_gap * 0.35, 0.7), 2),
                    time_horizon=self._time_horizon_for_action("install_camera"),
                    implementation_cost=18_000_000.0,
                )
            )

        if not any(action.action_type == "reallocate_budget" for action in actions):
            actions.append(
                AIActionPayload(
                    action_type="reallocate_budget",
                    title=f"Перераспределить бюджет в пользу {segment.name}",
                    description="Перенаправить доступный бюджет района на участок с максимальной отдачей.",
                    urgency="this_quarter",
                    location_label=segment.name,
                    effect_text="Увеличить совокупную экономию района за счёт приоритизации самого проблемного участка.",
                    financial_impact=round(savings + (1 - segment.camera_coverage_score) * 12_000_000, 2),
                    risk_reduction=round(min(0.2 + (road_pressure + safety_gap) * 0.12, 0.55), 2),
                    time_horizon="этот квартал",
                    implementation_cost=0.0,
                )
            )

        return actions[:4]

    def _generate_mock_recommendations(self, segment: RoadSegment, scenario: str) -> tuple[AIRecommendationPayload, str]:
        savings = max(segment.estimated_emergency_cost - segment.estimated_fix_now_cost, 0)
        road_pressure = (segment.defect_score / 100) * 0.55 + segment.seasonal_decay_rate * 0.45
        safety_gap = (1 - segment.camera_coverage_score) * 0.6 + segment.accident_risk_score * 0.4
        priority_score = min(round((road_pressure + safety_gap) * 50, 1), 100.0)

        actions: list[AIActionPayload] = []

        if scenario in {"road_damage", "combined"}:
            urgency = "fix_now" if segment.risk_level == "red" else "this_quarter"
            actions.append(
                AIActionPayload(
                    action_type="fix_now" if urgency == "fix_now" else "fix_this_quarter",
                    title=f"Отремонтировать {segment.name}",
                    description="Назначить бригаду и закрыть критичные дефекты на этом участке.",
                    urgency=urgency,
                    location_label=segment.name,
                    effect_text="Предотвратить ускоренную деградацию покрытия и аварийный ремонт.",
                    financial_impact=round(savings, 2),
                    risk_reduction=round(min(0.62 + road_pressure * 0.2, 0.95), 2),
                    time_horizon="3 месяца" if urgency == "fix_now" else "этот квартал",
                    implementation_cost=segment.estimated_fix_now_cost,
                )
            )
            actions.append(
                AIActionPayload(
                    action_type="monitor",
                    title=f"Проверить повторно {segment.name}",
                    description="Оставить участок под наблюдением и перепроверить состояние покрытия.",
                    urgency="monitor",
                    location_label=segment.name,
                    effect_text="Сдержать расходы до подтверждения дальнейшего ухудшения.",
                    financial_impact=round(segment.estimated_fix_now_cost * 0.18, 2),
                    risk_reduction=round(max(0.12, road_pressure * 0.18), 2),
                    time_horizon="3 месяца",
                    implementation_cost=round(segment.estimated_fix_now_cost * 0.08, 2),
                )
            )

        if scenario in {"camera_gap", "combined"} and segment.camera_coverage_score < 0.75:
            actions.append(
                AIActionPayload(
                    action_type="install_camera",
                    title=f"Установить камеру на {segment.name}",
                    description="Закрыть неохваченный камерами участок и усилить фиксацию нарушений.",
                    urgency="this_quarter",
                    location_label=segment.name,
                    effect_text="Снизить аварийность и добавить прогнозируемый штрафной поток.",
                    financial_impact=round((1 - segment.camera_coverage_score) * 24_000_000, 2),
                    risk_reduction=round(min(0.25 + safety_gap * 0.35, 0.7), 2),
                    time_horizon="12 месяцев",
                    implementation_cost=18_000_000,
                )
            )
            actions.append(
                AIActionPayload(
                    action_type="increase_patrol",
                    title=f"Усилить патрулирование на {segment.name}",
                    description="Ввести временное патрулирование до капитального решения по камерам.",
                    urgency="this_quarter",
                    location_label=segment.name,
                    effect_text="Снизить риск нарушений быстрее, но с меньшей эффективностью.",
                    financial_impact=round((1 - segment.camera_coverage_score) * 7_500_000, 2),
                    risk_reduction=round(min(0.14 + safety_gap * 0.18, 0.45), 2),
                    time_horizon="2 месяца",
                    implementation_cost=4_500_000,
                )
            )

        actions.append(
            AIActionPayload(
                action_type="reallocate_budget",
                title=f"Перераспределить бюджет в пользу {segment.name}",
                description="Перенести средства с low-impact работ на этот сегмент для максимальной отдачи.",
                urgency="this_quarter",
                location_label=segment.name,
                effect_text="Увеличить совокупную экономию бюджета по району.",
                financial_impact=round(savings + (1 - segment.camera_coverage_score) * 12_000_000, 2),
                risk_reduction=round(min(0.2 + (road_pressure + safety_gap) * 0.12, 0.55), 2),
                time_horizon="this quarter",
                implementation_cost=0.0,
            )
        )

        payload = AIRecommendationPayload(
            summary=(
                f"Сегмент {segment.name} требует приоритетного внимания: "
                f"ремонт и усиление контроля дают наибольший финансовый эффект."
            ),
            priority_score=priority_score,
            actions=actions,
        )
        return payload, json.dumps(payload.model_dump(mode="json"), ensure_ascii=False)

    def _generate_mock_forecast(
        self, action: RecommendedAction, segment: RoadSegment, notes: str | None = None
    ) -> tuple[dict[str, float | str], str]:
        modifier = 1.08 if segment.risk_level == "red" else 0.93
        projected_savings = round(action.financial_impact * modifier, 2)
        projected_revenue = round(
            projected_savings * 0.22 if action.action_type in {"install_camera", "increase_patrol"} else 0.0,
            2,
        )
        projected_accident_reduction = round(
            max(action.risk_reduction * 3.4, 0.2) if action.action_type != "monitor" else 0.4,
            2,
        )
        projected_risk_change = round(-action.risk_reduction, 2)
        summary = (
            f"Выбор действия '{action.title}' для сегмента {segment.name} "
            f"даст ожидаемый эффект в течение {action.time_horizon.lower()}."
        )
        if notes:
            summary = f"{summary} Учитываем примечание пользователя: {notes}"

        payload = {
            "forecast_summary": summary,
            "projected_savings": projected_savings,
            "projected_revenue": projected_revenue,
            "projected_accident_reduction": projected_accident_reduction,
            "projected_risk_change": projected_risk_change,
        }
        return payload, json.dumps(payload, ensure_ascii=False)

    def _risk_score(self, segment: RoadSegment) -> float:
        return round(
            min(
                1.0,
                max(
                    0.0,
                    (segment.defect_score / 100) * 0.45
                    + segment.accident_risk_score * 0.35
                    + (1 - segment.camera_coverage_score) * 0.20,
                ),
            ),
            2,
        )

    def _mood_index(self, segment: RoadSegment) -> float:
        score = 100 - (
            segment.defect_score * 0.45
            + segment.accident_risk_score * 22
            + (1 - segment.camera_coverage_score) * 12
        )
        return round(min(max(score, 10.0), 95.0), 1)

    def _pollution_index(self, segment: RoadSegment) -> float:
        road_class_factor = {"arterial": 0.18, "collector": 0.12, "local": 0.06}.get(segment.road_class, 0.1)
        traffic_factor = min(segment.traffic_volume / 60000, 1.0) * 0.65
        return round(min(max(traffic_factor + road_class_factor, 0.05), 1.0), 2)

    def _traffic_index(self, segment: RoadSegment) -> float:
        traffic_factor = min(segment.traffic_volume / 62000, 1.0) * 0.7
        safety_factor = segment.accident_risk_score * 0.2 + (1 - segment.camera_coverage_score) * 0.1
        return round(min(max(traffic_factor + safety_factor, 0.05), 1.0), 2)

    def _complaints_count(self, segment: RoadSegment) -> int:
        return max(1, int(round(segment.defect_score * 0.22 + (1 - segment.camera_coverage_score) * 12)))

    def _priority_score(self, segment: RoadSegment) -> float:
        road_pressure = (segment.defect_score / 100) * 0.55 + segment.seasonal_decay_rate * 0.45
        safety_gap = (1 - segment.camera_coverage_score) * 0.6 + segment.accident_risk_score * 0.4
        return min(round((road_pressure + safety_gap) * 50, 1), 100.0)

    def _urgency_for_action(self, action_type: str, segment: RoadSegment) -> str:
        if action_type == "monitor":
            return "monitor"
        if action_type == "fix_now":
            return "fix_now"
        if segment.risk_level == "red":
            return "this_quarter"
        return "this_quarter"

    def _time_horizon_for_action(self, action_type: str) -> str:
        mapping = {
            "fix_now": "3 месяца",
            "fix_this_quarter": "этот квартал",
            "install_camera": "12 месяцев",
            "increase_patrol": "2 месяца",
            "monitor": "3 месяца",
            "reallocate_budget": "этот квартал",
        }
        return mapping.get(action_type, "этот квартал")

    def _title_from_text(self, text: str, segment_name: str) -> str:
        cleaned = self._normalize_text(text).strip()
        if not cleaned:
            return f"Действие для участка {segment_name}"
        return cleaned[:255]

    def _safe_float(self, value: Any, default: float) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _normalize_text(self, value: str) -> str:
        text = str(value)
        replacements = {
            "$": "",
            "USD": "тенге",
            "usd": "тенге",
            "dollars": "тенге",
            "dollar": "тенге",
            "annual revenue": "годовые поступления",
            "breakeven": "окупаемость",
            "Priority": "Приоритет",
            "priority": "приоритет",
            "action": "действие",
            "Repair": "Ремонт",
            "Install": "Установить",
        }
        for old, new in replacements.items():
            text = text.replace(old, new)
        return " ".join(text.split())
