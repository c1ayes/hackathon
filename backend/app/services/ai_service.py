import json

from app.db.models import RecommendedAction, RoadSegment
from app.schemas.recommendation import AIActionPayload, AIRecommendationPayload


class AIService:
    def generate_recommendations(self, segment: RoadSegment, scenario: str) -> tuple[AIRecommendationPayload, str]:
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
                    time_horizon="3 months" if urgency == "fix_now" else "this quarter",
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
                    time_horizon="3 months",
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
                    time_horizon="12 months",
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
                    time_horizon="2 months",
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

    def generate_forecast(
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
