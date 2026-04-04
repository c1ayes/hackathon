"""
Pipeline Orchestration Module

Orchestrates the Brain 1 → Brain 2 → merged response flow.
This is the main entry point for unified analysis.
"""

import json
from datetime import datetime
from typing import Any

from services.brain1_scoring import calculate_all_road_scores, calculate_all_camera_scores
from services.brain2_prompts import (
    build_brain2_prompt,
    parse_brain2_response,
    extract_key_insights,
)
from services.ollama_service import call_brain2_analysis


def run_analysis_pipeline(
    roads_data: dict,
    cameras_data: dict,
    top_n: int = 3,
    skip_llm: bool = False,
) -> dict:
    """
    Run the complete Brain 1 → Brain 2 analysis pipeline.
    
    Args:
        roads_data: Raw roads data from roads.json
        cameras_data: Raw cameras data from cameras.json
        top_n: Number of top segments/zones to analyze in detail
        skip_llm: If True, skip Brain 2 LLM call (useful for testing Brain 1 only)
    
    Returns:
        Unified response with Brain 1 + Brain 2 outputs merged
    """
    
    # === BRAIN 1: Deterministic Python Scoring ===
    
    # Extract segments and intersections from raw data
    road_segments = roads_data.get("segments", [])
    camera_intersections = cameras_data.get("intersections", [])
    
    # Calculate Brain 1 scores
    brain1_roads = calculate_all_road_scores(road_segments)
    brain1_cameras = calculate_all_camera_scores(camera_intersections)
    
    # Include metadata context
    brain1_roads["context"]["climate"] = roads_data.get("metadata", {}).get("climate", {})
    brain1_cameras["context"]["fine_structure"] = cameras_data.get("metadata", {}).get("fineStructure", {})
    
    # If skipping LLM, return Brain 1 only
    if skip_llm:
        return {
            "brain1_roads": brain1_roads,
            "brain1_cameras": brain1_cameras,
            "brain2": None,
            "key_insights": None,
            "analysis_metadata": {
                "pipeline_mode": "brain1_only",
                "timestamp": datetime.utcnow().isoformat(),
                "top_n_analyzed": top_n,
                "llm_skipped": True,
            },
        }
    
    # === BRAIN 2: LLM Analysis ===
    
    # Build prompt with Brain 1 output
    prompt = build_brain2_prompt(brain1_roads, brain1_cameras, top_n=top_n)
    
    # Call Ollama LLM
    brain2_raw = call_brain2_analysis(prompt)
    
    # Parse and validate response
    brain2 = parse_brain2_response(brain2_raw)
    brain2["enrichment"] = _ensure_enrichment_coverage(
        brain2.get("enrichment", {}),
        brain1_roads.get("segments", [])[:top_n],
        brain1_cameras.get("intersections", [])[:top_n],
    )
    
    # Extract key insights for dashboard summary
    key_insights = extract_key_insights(brain2)
    
    # === MERGE AND RETURN ===
    
    return {
        "brain1_roads": brain1_roads,
        "brain1_cameras": brain1_cameras,
        "brain2": brain2,
        "key_insights": key_insights,
        "analysis_metadata": {
            "pipeline_mode": "full",
            "timestamp": datetime.utcnow().isoformat(),
            "top_n_analyzed": top_n,
            "llm_model": "qwen2.5:7b",
            "brain1_road_data_completeness": brain1_roads["aggregates"]["avg_data_completeness"],
            "brain1_camera_data_completeness": brain1_cameras["aggregates"]["avg_data_completeness"],
            "brain2_confidence": brain2["overall_confidence"]["score_pct"],
        },
    }


def _ensure_enrichment_coverage(
    enrichment: dict[str, Any],
    top_roads: list[dict[str, Any]],
    top_cameras: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    roads = list(enrichment.get("roads") or [])
    cameras = list(enrichment.get("cameras") or [])

    road_ids = {item.get("segment_id") for item in roads}
    for road in top_roads:
        segment_id = road.get("segment_id")
        if segment_id in road_ids:
            continue
        roads.append(
            {
                "segment_id": segment_id,
                "hidden_risks": _fallback_road_hidden_risks(road),
                "urgency_adjustment": "higher" if road.get("is_critical") else "unchanged",
                "reasoning": _fallback_road_reasoning(road),
                "seasonal_note": _fallback_road_seasonal_note(road),
            }
        )

    camera_ids = {item.get("intersection_id") for item in cameras}
    for camera in top_cameras:
        intersection_id = camera.get("intersection_id")
        if intersection_id in camera_ids:
            continue
        cameras.append(
            {
                "intersection_id": intersection_id,
                "hidden_risks": _fallback_camera_hidden_risks(camera),
                "urgency_adjustment": "higher" if camera.get("is_survivorship_bias_case") else "unchanged",
                "reasoning": _fallback_camera_reasoning(camera),
                "survivorship_bias_note": _fallback_camera_bias_note(camera),
            }
        )

    return {"roads": roads, "cameras": cameras}


def _fallback_road_hidden_risks(road: dict[str, Any]) -> str:
    risks: list[str] = []
    if road.get("is_high_freeze_risk"):
        risks.append("сезонные циклы заморозки и оттаивания могут ускорить разрушение покрытия")
    if road.get("is_truck_heavy"):
        risks.append("высокая доля грузового транспорта создаёт нелинейную нагрузку на полотно")
    if road.get("failure_probability_12mo", 0) >= 0.5:
        risks.append("есть высокий риск быстрого перехода к аварийному ремонту в ближайшие 12 месяцев")
    if not risks:
        risks.append("объект требует наблюдения из-за сочетания инфраструктурной нагрузки и финансового риска")
    sentence = "; ".join(risks)
    return sentence[:1].upper() + sentence[1:] + "."


def _fallback_road_reasoning(road: dict[str, Any]) -> str:
    notes = road.get("notes")
    if notes:
        return notes
    return (
        f"Сегмент {road.get('name', road.get('segment_id', 'дороги'))} входит в верхнюю часть рейтинга Brain 1 "
        f"с приоритетом {round(float(road.get('priority_score', 0)))} и требует внимания по совокупности риска и стоимости."
    )


def _fallback_road_seasonal_note(road: dict[str, Any]) -> str:
    if road.get("is_high_freeze_risk"):
        return "Для этого сегмента особенно важен ремонт до периода активных перепадов температуры."
    return "Сезонный фактор умеренный, но откладывание ремонта увеличивает стоимость вмешательства."


def _fallback_camera_hidden_risks(camera: dict[str, Any]) -> str:
    risks: list[str] = []
    if not camera.get("is_monitored"):
        risks.append("отсутствие камеры скрывает часть нарушений и создаёт ложное ощущение безопасности")
    if camera.get("is_critical_gap"):
        risks.append("критический пробел в покрытии повышает риск незафиксированных инцидентов")
    if camera.get("is_high_violation_zone"):
        risks.append("высокая интенсивность нарушений указывает на потребность в приоритетном контроле")
    if not risks:
        risks.append("объект требует дополнительного наблюдения для уточнения реального уровня риска")
    sentence = "; ".join(risks)
    return sentence[:1].upper() + sentence[1:] + "."


def _fallback_camera_reasoning(camera: dict[str, Any]) -> str:
    notes = camera.get("notes")
    if notes:
        return notes
    return (
        f"Узел {camera.get('name', camera.get('intersection_id', 'камеры'))} находится в верхней группе Brain 1 "
        f"с приоритетом {round(float(camera.get('priority_score', 0)))} и требует отдельного внимания."
    )


def _fallback_camera_bias_note(camera: dict[str, Any]) -> str | None:
    if camera.get("is_survivorship_bias_case"):
        return "Отсутствие записей о нарушениях здесь не означает безопасность: данные могут отсутствовать из-за отсутствия камеры."
    return None


def run_roads_only_pipeline(roads_data: dict, top_n: int = 3) -> dict:
    """
    Run Brain 1 scoring for roads only (backward compatibility).
    
    Returns Brain 1 output in a format compatible with existing endpoints.
    """
    road_segments = roads_data.get("segments", [])
    brain1_roads = calculate_all_road_scores(road_segments)
    
    # Add climate metadata
    brain1_roads["context"]["climate"] = roads_data.get("metadata", {}).get("climate", {})
    
    return brain1_roads


def run_cameras_only_pipeline(cameras_data: dict, top_n: int = 3) -> dict:
    """
    Run Brain 1 scoring for cameras only (backward compatibility).
    
    Returns Brain 1 output in a format compatible with existing endpoints.
    """
    camera_intersections = cameras_data.get("intersections", [])
    brain1_cameras = calculate_all_camera_scores(camera_intersections)
    
    # Add fine structure metadata
    brain1_cameras["context"]["fine_structure"] = cameras_data.get("metadata", {}).get("fineStructure", {})
    
    return brain1_cameras


def generate_merged_recommendations(unified_result: dict) -> list[dict]:
    """
    Generate merged recommendations from Brain 1 + Brain 2 analysis.
    
    Combines priority scores with LLM enrichment to produce actionable items.
    """
    recommendations = []
    
    brain1_roads = unified_result.get("brain1_roads", {})
    brain1_cameras = unified_result.get("brain1_cameras", {})
    brain2 = unified_result.get("brain2", {})
    
    # Get enrichment data if available
    road_enrichments = {e["segment_id"]: e for e in brain2.get("enrichment", {}).get("roads", [])}
    camera_enrichments = {e["intersection_id"]: e for e in brain2.get("enrichment", {}).get("cameras", [])}
    
    # Top 3 road segments
    for seg in brain1_roads.get("segments", [])[:3]:
        seg_id = seg["segment_id"]
        enrichment = road_enrichments.get(seg_id, {})
        
        rec = {
            "type": "road_repair",
            "priority_rank": seg["brain1_rank"],
            "entity_id": seg_id,
            "entity_name": seg["name"],
            "priority_score": seg["priority_score"],
            "urgency": _determine_urgency(seg, enrichment),
            "financial_impact_tenge": seg["financial_impact"]["total_impact_tenge"],
            "fix_cost_tenge": seg.get("fix_cost_tenge"),
            "emergency_cost_tenge": seg.get("emergency_cost_tenge"),
            "data_completeness": seg["data_completeness_score"],
            "reasoning": enrichment.get("reasoning", seg.get("notes", "")),
            "hidden_risks": enrichment.get("hidden_risks"),
            "seasonal_note": enrichment.get("seasonal_note"),
            "flags": {
                "is_critical": seg["is_critical"],
                "is_high_freeze_risk": seg["is_high_freeze_risk"],
                "is_truck_heavy": seg["is_truck_heavy"],
            },
        }
        recommendations.append(rec)
    
    # Top 3 camera zones (prioritize unmonitored)
    for cam in brain1_cameras.get("intersections", [])[:3]:
        cam_id = cam["intersection_id"]
        enrichment = camera_enrichments.get(cam_id, {})
        
        rec = {
            "type": "camera_install" if not cam["is_monitored"] else "camera_optimization",
            "priority_rank": cam["brain1_rank"],
            "entity_id": cam_id,
            "entity_name": cam["name"],
            "priority_score": cam["priority_score"],
            "urgency": "immediate" if cam["is_survivorship_bias_case"] else "this_quarter",
            "financial_impact_tenge": cam["roi"]["estimated_annual_revenue_tenge"],
            "install_cost_tenge": cam["roi"]["install_cost_tenge"],
            "breakeven_months": cam["roi"]["breakeven_months"],
            "data_completeness": cam["data_completeness_score"],
            "reasoning": enrichment.get("reasoning", cam.get("notes", "")),
            "hidden_risks": enrichment.get("hidden_risks"),
            "survivorship_bias_note": enrichment.get("survivorship_bias_note"),
            "flags": {
                "is_critical_gap": cam["is_critical_gap"],
                "is_high_violation_zone": cam["is_high_violation_zone"],
                "is_survivorship_bias_case": cam["is_survivorship_bias_case"],
            },
        }
        recommendations.append(rec)
    
    # Add overlap-based recommendations
    for overlap in brain2.get("overlaps", []):
        if overlap.get("overlap_exists"):
            rec = {
                "type": "cross_domain_action",
                "priority_rank": 0,  # Top priority for overlaps
                "entity_id": f"{overlap['road_segment']}_{overlap['camera_zone']}",
                "entity_name": f"{overlap['road_segment']} + {overlap['camera_zone']}",
                "priority_score": 100,  # Max priority for overlaps
                "urgency": "immediate",
                "reasoning": overlap.get("causal_explanation", ""),
                "compounding_risk": overlap.get("compounding_risk"),
                "recommendation": overlap.get("recommendation"),
                "flags": {
                    "is_overlap": True,
                    "overlap_type": overlap.get("overlap_type"),
                },
            }
            recommendations.append(rec)
    
    # Sort by priority (overlaps first, then by priority_rank)
    recommendations.sort(key=lambda r: (r.get("type") != "cross_domain_action", r["priority_rank"]))
    
    return recommendations


def _determine_urgency(segment: dict, enrichment: dict) -> str:
    """Determine urgency level based on Brain 1 + Brain 2 signals."""
    # Brain 2 can override
    adjustment = enrichment.get("urgency_adjustment", "unchanged")
    
    # Base urgency from Brain 1
    if segment["is_critical"]:
        base = "immediate"
    elif segment["priority_score"] >= 70:
        base = "this_quarter"
    elif segment["priority_score"] >= 50:
        base = "next_quarter"
    else:
        base = "monitor"
    
    # Apply Brain 2 adjustment
    urgency_levels = ["monitor", "next_quarter", "this_quarter", "immediate"]
    current_idx = urgency_levels.index(base)
    
    if adjustment == "higher" and current_idx < len(urgency_levels) - 1:
        return urgency_levels[current_idx + 1]
    elif adjustment == "lower" and current_idx > 0:
        return urgency_levels[current_idx - 1]
    
    return base


def generate_executive_summary(unified_result: dict) -> dict:
    """
    Generate an executive summary for the dashboard.
    
    High-level metrics for city officials who need quick decisions.
    """
    brain1_roads = unified_result.get("brain1_roads", {})
    brain1_cameras = unified_result.get("brain1_cameras", {})
    brain2 = unified_result.get("brain2", {})
    key_insights = unified_result.get("key_insights", {})
    
    road_agg = brain1_roads.get("aggregates", {})
    cam_agg = brain1_cameras.get("aggregates", {})
    
    return {
        "headline": _generate_headline(road_agg, cam_agg, key_insights),
        "total_potential_savings_tenge": road_agg.get("total_potential_savings_tenge", 0),
        "total_projected_revenue_tenge": cam_agg.get("projected_additional_revenue_tenge", 0),
        "critical_road_segments": road_agg.get("critical_count", 0),
        "unmonitored_camera_zones": cam_agg.get("unmonitored_count", 0),
        "cross_domain_overlaps": key_insights.get("overlap_count", 0),
        "data_quality_issues": key_insights.get("type_b_anomaly_count", 0),
        "overall_confidence_pct": brain2.get("overall_confidence", {}).get("score_pct", 0),
        "recommended_immediate_actions": sum(
            1 for seg in brain1_roads.get("segments", [])[:3]
            if seg.get("is_critical")
        ) + sum(
            1 for cam in brain1_cameras.get("intersections", [])[:3]
            if cam.get("is_survivorship_bias_case")
        ),
    }


def _generate_headline(road_agg: dict, cam_agg: dict, key_insights: dict) -> str:
    """Generate a one-line headline for the executive summary."""
    savings = road_agg.get("total_potential_savings_tenge", 0) / 1_000_000
    revenue = cam_agg.get("projected_additional_revenue_tenge", 0) / 1_000_000
    critical = road_agg.get("critical_count", 0)
    unmonitored = cam_agg.get("unmonitored_count", 0)
    
    if key_insights.get("overlap_count", 0) > 0:
        return f"Cross-domain risk detected: {critical} critical roads + {unmonitored} camera gaps share corridors. Act now to save {savings:.0f}M tenge."
    elif critical >= 2:
        return f"{critical} critical road segments require immediate intervention. Potential savings: {savings:.0f}M tenge."
    elif unmonitored >= 1:
        return f"{unmonitored} unmonitored camera zones identified. Projected annual revenue: {revenue:.0f}M tenge."
    else:
        return f"Infrastructure status stable. Monitor {road_agg.get('total_segments', 0)} road segments and {cam_agg.get('total_intersections', 0)} camera zones."
