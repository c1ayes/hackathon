"""
Brain 1 — Deterministic Python Scoring Module

All formulas are fully deterministic: same inputs always produce identical outputs.
No LLM calls. No randomness. Pure math.

Scoring for:
1. Road Decay ROI — road_pressure, priority_score, financial_impact
2. Traffic Camera Allocation — safety_gap, roi_score

Both produce data_completeness_score for Brain 2 confidence calculation.
"""

from typing import Any, Literal

# === CONSTANTS (Almaty-specific) ===
FREEZE_THAW_CYCLES_PER_YEAR = 35
HIGH_RISK_MONTHS = [2, 3, 4, 10, 11]  # Feb-Apr, Oct-Nov
CAMERA_INSTALL_COST_TENGE = 8_500_000
CAMERA_MAINTENANCE_YEARLY_TENGE = 600_000
FINE_AVG_TENGE = 28_000
COLLECTION_RATE = 0.65

# Economic value by road class (tenge per day of disruption)
ROAD_ECONOMIC_VALUE_BY_CLASS = {
    "arterial": 15_000_000,
    "arterial_6lane": 15_000_000,
    "arterial_new_industrial": 14_000_000,
    "sub_arterial": 8_000_000,
    "sub_arterial_industrial": 9_000_000,
    "sub_arterial_central": 8_500_000,
    "sub_arterial_entry_corridor": 10_000_000,
    "city_entry_arterial": 10_000_000,
    "collector": 3_000_000,
    "collector_residential": 2_500_000,
    "collector_slope": 3_000_000,
    "collector_mixed": 3_500_000,
    "residential": 1_000_000,
}

# Disruption multiplier by road class (how much disruption affects city operations)
DISRUPTION_MULTIPLIER_BY_CLASS = {
    "arterial": 2.0,
    "arterial_6lane": 2.0,
    "arterial_new_industrial": 1.8,
    "sub_arterial": 1.5,
    "sub_arterial_industrial": 1.6,
    "sub_arterial_central": 1.5,
    "sub_arterial_entry_corridor": 1.7,
    "city_entry_arterial": 1.7,
    "collector": 1.2,
    "collector_residential": 1.1,
    "collector_slope": 1.3,
    "collector_mixed": 1.2,
    "residential": 1.0,
}


TrafficTier = Literal["low", "medium", "high", "arterial"]


def derive_traffic_tier(vehicles_per_day: int | None) -> TrafficTier:
    """Derive traffic tier from daily vehicle count."""
    if vehicles_per_day is None:
        return "medium"  # Default assumption
    if vehicles_per_day >= 30_000:
        return "arterial"
    if vehicles_per_day >= 15_000:
        return "high"
    if vehicles_per_day >= 5_000:
        return "medium"
    return "low"


def traffic_tier_to_numeric(tier: TrafficTier) -> float:
    """Convert traffic tier to numeric value for calculations (0-4 scale)."""
    return {"low": 1, "medium": 2, "high": 3, "arterial": 4}.get(tier, 2)


def _get_road_class_key(road_class: str) -> str:
    """Normalize road class string to lookup key."""
    normalized = road_class.lower().replace(" ", "_").replace("-", "_")
    # Try exact match first
    if normalized in ROAD_ECONOMIC_VALUE_BY_CLASS:
        return normalized
    # Try prefix matching
    for key in ROAD_ECONOMIC_VALUE_BY_CLASS:
        if normalized.startswith(key.split("_")[0]):
            return key
    return "collector"  # Default


def _is_valid_value(value: Any, min_val: float = 0, max_val: float = float("inf")) -> bool:
    """Check if a value is non-null and within plausible range."""
    if value is None:
        return False
    try:
        num = float(value)
        return min_val <= num <= max_val
    except (TypeError, ValueError):
        return False


# === ROAD SCORING ===


def calculate_road_data_completeness(segment: dict) -> float:
    """
    Calculate data completeness score (0-1) for a road segment.
    
    Checks for presence and validity of expected fields.
    """
    checks = [
        _is_valid_value(segment.get("defectsPer100m"), 0, 50),
        _is_valid_value(segment.get("freezeExposureScore"), 0, 1),
        _is_valid_value(segment.get("dailyTrafficVehicles"), 0, 200_000),
        _is_valid_value(segment.get("truckSharePercent"), 0, 100),
        _is_valid_value(segment.get("fixCostTenge"), 0, 10_000_000_000),
        _is_valid_value(segment.get("emergencyRepairCostTenge"), 0, 50_000_000_000),
        _is_valid_value(segment.get("failureProbability12mo"), 0, 1),
        segment.get("class") is not None,
    ]
    return sum(checks) / len(checks)


def calculate_truck_damage_factor(truck_share_pct: float | None) -> float:
    """
    Calculate nonlinear truck damage factor.
    
    Trucks cause disproportionate pavement damage (~10,000x more per axle pass
    than passenger vehicles due to 4th power law of axle loading).
    We model this as a nonlinear multiplier.
    """
    if truck_share_pct is None or truck_share_pct <= 0:
        return 1.0
    # Nonlinear scaling: (share)^1.5 reflects disproportionate damage
    return 1.0 + (truck_share_pct / 100) ** 1.5 * 3.0


def calculate_road_pressure(segment: dict) -> float:
    """
    Calculate road_pressure score (0-1 scale).
    
    Combines defect severity, seasonal decay, freeze exposure, and truck damage.
    Higher = more urgent intervention needed.
    """
    # Extract values with defaults
    defect_score = segment.get("defectsPer100m", 5) * 10  # Convert to 0-100 scale (assuming max 10 defects)
    defect_score = min(defect_score, 100) / 100  # Normalize to 0-1
    
    seasonal_decay = segment.get("failureProbability12mo", 0.5)  # Use failure prob as decay proxy
    freeze_exposure = segment.get("freezeExposureScore", 0.5)
    truck_share = segment.get("truckSharePercent", 5)
    
    truck_damage_factor = calculate_truck_damage_factor(truck_share)
    truck_damage_normalized = min(truck_damage_factor / 2.5, 1.0)  # Cap at 1.0
    
    # Weighted combination
    road_pressure = (
        defect_score * 0.35 +
        seasonal_decay * 0.25 +
        freeze_exposure * 0.20 +
        truck_damage_normalized * 0.20
    )
    
    return min(max(road_pressure, 0), 1)


def calculate_road_priority_score(segment: dict) -> float:
    """
    Calculate priority_score (0-100 scale) incorporating economic value.
    
    A moderately damaged high-value road can outrank a severely damaged low-traffic road.
    """
    road_pressure = calculate_road_pressure(segment)
    
    # Economic value weighting
    road_class = segment.get("class", "collector")
    class_key = _get_road_class_key(road_class)
    economic_value = ROAD_ECONOMIC_VALUE_BY_CLASS.get(class_key, 3_000_000)
    
    # Normalize economic value (arterial = 1.0, residential = ~0.07)
    economic_weight = economic_value / 15_000_000
    
    # Traffic volume bonus
    traffic = segment.get("dailyTrafficVehicles", 10_000)
    traffic_tier = derive_traffic_tier(traffic)
    traffic_bonus = traffic_tier_to_numeric(traffic_tier) / 4 * 0.1  # Up to 0.1 bonus
    
    # Combined priority
    priority = (road_pressure * 0.55 + economic_weight * 0.35 + traffic_bonus) * 100
    
    return min(max(round(priority, 1), 0), 100)


def calculate_road_financial_impact(segment: dict) -> dict:
    """
    Calculate financial_impact for a road segment.
    
    Formula:
    financial_impact = (emergency_cost - fix_now_cost) + 
                       (road_economic_value × days_until_failure × disruption_multiplier)
    
    Returns dict with component breakdown.
    """
    fix_now = segment.get("fixCostTenge", 100_000_000)
    emergency = segment.get("emergencyRepairCostTenge", fix_now * 3.2)
    
    # Direct cost delta
    repair_cost_delta = max(emergency - fix_now, 0)
    
    # Economic disruption cost
    road_class = segment.get("class", "collector")
    class_key = _get_road_class_key(road_class)
    economic_value_per_day = ROAD_ECONOMIC_VALUE_BY_CLASS.get(class_key, 3_000_000)
    disruption_multiplier = DISRUPTION_MULTIPLIER_BY_CLASS.get(class_key, 1.2)
    
    # Estimate days until failure from failure probability
    failure_prob = segment.get("failureProbability12mo", 0.5)
    # Higher probability = sooner failure
    estimated_days_until_failure = int((1 - failure_prob) * 365)
    estimated_days_until_failure = max(estimated_days_until_failure, 30)  # Minimum 30 days
    
    # Economic disruption impact (costs during disruption period)
    # Assume disruption lasts 14 days for emergency repair vs 5 days for planned
    disruption_days_emergency = 14
    disruption_days_planned = 5
    economic_loss_delta = (
        economic_value_per_day * disruption_days_emergency * disruption_multiplier -
        economic_value_per_day * disruption_days_planned * 0.7  # Planned has lower disruption
    )
    
    total_impact = repair_cost_delta + economic_loss_delta
    
    return {
        "total_impact_tenge": round(total_impact),
        "repair_cost_delta_tenge": round(repair_cost_delta),
        "economic_loss_delta_tenge": round(economic_loss_delta),
        "estimated_days_until_failure": estimated_days_until_failure,
        "economic_value_per_day_tenge": economic_value_per_day,
        "disruption_multiplier": disruption_multiplier,
    }


def score_road_segment(segment: dict) -> dict:
    """
    Score a single road segment with all Brain 1 metrics.
    
    Returns enriched segment with computed scores.
    """
    road_pressure = calculate_road_pressure(segment)
    priority_score = calculate_road_priority_score(segment)
    financial_impact = calculate_road_financial_impact(segment)
    data_completeness = calculate_road_data_completeness(segment)
    traffic_tier = derive_traffic_tier(segment.get("dailyTrafficVehicles"))
    truck_damage_factor = calculate_truck_damage_factor(segment.get("truckSharePercent"))
    
    return {
        "segment_id": segment.get("id"),
        "name": segment.get("name"),
        "road_class": segment.get("class"),
        "district": _infer_district(segment),
        
        # Original data (preserved)
        "defects_per_100m": segment.get("defectsPer100m"),
        "daily_traffic_vehicles": segment.get("dailyTrafficVehicles"),
        "truck_share_percent": segment.get("truckSharePercent"),
        "freeze_exposure_score": segment.get("freezeExposureScore"),
        "current_severity": segment.get("currentSeverity"),
        "fix_cost_tenge": segment.get("fixCostTenge"),
        "emergency_cost_tenge": segment.get("emergencyRepairCostTenge"),
        "failure_probability_12mo": segment.get("failureProbability12mo"),
        "original_priority_rank": segment.get("priorityRank"),
        "coordinates": segment.get("coordinates"),
        "notes": segment.get("notes"),
        
        # Brain 1 computed scores
        "traffic_tier": traffic_tier,
        "truck_damage_factor": round(truck_damage_factor, 2),
        "road_pressure": round(road_pressure, 3),
        "priority_score": priority_score,
        "financial_impact": financial_impact,
        "data_completeness_score": round(data_completeness, 2),
        
        # Risk flags
        "is_high_freeze_risk": segment.get("freezeExposureScore", 0) >= 0.8,
        "is_truck_heavy": (segment.get("truckSharePercent") or 0) >= 15,
        "is_critical": segment.get("currentSeverity") == "critical",
    }


def _infer_district(segment: dict) -> str:
    """Infer district from segment location or name (mock for Almaty)."""
    name = segment.get("name", "").lower()
    coords = segment.get("coordinates", {})
    lat = coords.get("lat", 43.25)
    
    # Simple heuristic based on latitude bands
    if lat > 43.27:
        return "Turksib"
    elif lat > 43.25:
        return "Almaly"
    elif lat > 43.23:
        return "Medeu"
    else:
        return "Bostandyk"


def calculate_all_road_scores(segments: list[dict]) -> dict:
    """
    Calculate Brain 1 scores for all road segments.
    
    Returns ranked list and aggregate statistics.
    """
    scored_segments = [score_road_segment(seg) for seg in segments]
    
    # Sort by priority score (descending)
    scored_segments.sort(key=lambda x: x["priority_score"], reverse=True)
    
    # Add rank
    for rank, seg in enumerate(scored_segments, 1):
        seg["brain1_rank"] = rank
    
    # Calculate aggregates
    total_fix_cost = sum(s.get("fix_cost_tenge") or 0 for s in scored_segments)
    total_emergency_cost = sum(s.get("emergency_cost_tenge") or 0 for s in scored_segments)
    total_savings = total_emergency_cost - total_fix_cost
    avg_data_completeness = sum(s["data_completeness_score"] for s in scored_segments) / len(scored_segments) if scored_segments else 0
    
    critical_count = sum(1 for s in scored_segments if s["is_critical"])
    high_freeze_count = sum(1 for s in scored_segments if s["is_high_freeze_risk"])
    truck_heavy_count = sum(1 for s in scored_segments if s["is_truck_heavy"])
    
    return {
        "segments": scored_segments,
        "top_3_priority_ids": [s["segment_id"] for s in scored_segments[:3]],
        "aggregates": {
            "total_segments": len(scored_segments),
            "critical_count": critical_count,
            "high_freeze_risk_count": high_freeze_count,
            "truck_heavy_count": truck_heavy_count,
            "total_fix_cost_tenge": total_fix_cost,
            "total_emergency_cost_tenge": total_emergency_cost,
            "total_potential_savings_tenge": total_savings,
            "avg_data_completeness": round(avg_data_completeness, 2),
            "top_3_combined_financial_impact_tenge": sum(
                s["financial_impact"]["total_impact_tenge"] for s in scored_segments[:3]
            ),
        },
        "context": {
            "freeze_thaw_cycles_per_year": FREEZE_THAW_CYCLES_PER_YEAR,
            "high_risk_months": HIGH_RISK_MONTHS,
            "analysis_type": "road_decay_roi",
        },
    }


# === CAMERA SCORING ===


def calculate_camera_data_completeness(intersection: dict) -> float:
    """
    Calculate data completeness score (0-1) for a camera zone.
    
    Note: violations_per_month can be null for unmonitored zones — this is NOT a data gap,
    it's the survivorship bias signal. We don't penalize for it.
    """
    is_monitored = intersection.get("isMonitored", False)
    
    checks = [
        _is_valid_value(intersection.get("coverageGapToNextCameraKm"), 0, 10),
        _is_valid_value(intersection.get("accidentsPerYear"), 0, 100),
        _is_valid_value(intersection.get("dailyTrafficVehicles"), 0, 200_000),
        _is_valid_value(intersection.get("riskScore"), 0, 1),
        intersection.get("coordinates") is not None,
        intersection.get("roadClass") is not None,
    ]
    
    # For monitored zones, violations data should exist
    if is_monitored:
        checks.append(_is_valid_value(intersection.get("violationsPerMonth"), 0, 5000))
    # For unmonitored, check if estimate exists
    else:
        checks.append(
            _is_valid_value(intersection.get("estimatedViolationsPerMonth"), 0, 5000) or
            _is_valid_value(intersection.get("postCameraViolationRate"), 0, 1)
        )
    
    return sum(checks) / len(checks)


def derive_road_politeness_score(
    violations_per_month: int | None,
    traffic_volume: int | None,
    is_monitored: bool
) -> float | None:
    """
    Derive road politeness score (law-abiding rate) from violations/traffic ratio.
    
    Returns None if cannot be calculated (unmonitored zone with no estimates).
    """
    if not is_monitored or violations_per_month is None or traffic_volume is None:
        return None
    
    if traffic_volume <= 0:
        return None
    
    # Estimate monthly traffic passes (30 days)
    monthly_passes = traffic_volume * 30
    
    # Violation rate (what fraction of passes result in violation)
    violation_rate = violations_per_month / monthly_passes
    
    # Politeness = 1 - violation_rate (capped between 0.5 and 0.99)
    politeness = 1 - min(violation_rate * 100, 0.5)  # Scale up, cap at 50% violation rate
    
    return round(max(0.5, min(politeness, 0.99)), 2)


def estimate_post_camera_violation_rate(intersection: dict) -> float:
    """
    Estimate post-camera violation rate (behavioral signal).
    
    This represents the violation/collision rate 100m-1km AFTER the camera zone ends.
    Key insight: Where drivers revert to bad behavior after passing cameras.
    
    For mock data, we derive from road characteristics.
    """
    # If already provided in data, use it
    if "postCameraViolationRate" in intersection:
        return intersection["postCameraViolationRate"]
    
    # Estimate based on road type and traffic
    road_class = intersection.get("roadClass", "").lower()
    traffic = intersection.get("dailyTrafficVehicles", 15_000)
    coverage_gap = intersection.get("coverageGapToNextCameraKm", 0.5)
    
    base_rate = 0.35  # 35% baseline
    
    # Higher rate for arterials (drivers speed more)
    if "arterial" in road_class:
        base_rate += 0.15
    elif "entry" in road_class or "corridor" in road_class:
        base_rate += 0.20  # Entry points have speeding from highway
    
    # Larger coverage gap = more opportunity for violations
    gap_factor = min(coverage_gap / 2, 0.15)
    base_rate += gap_factor
    
    # High traffic can mean more aggressive driving
    if traffic > 30_000:
        base_rate += 0.05
    
    return round(min(base_rate, 0.75), 2)


def calculate_camera_safety_gap(intersection: dict) -> float:
    """
    Calculate safety_gap score (0-1 scale).
    
    Higher = more urgent need for camera installation.
    Weights post_camera_violation_rate heavily — this is the behavioral signal.
    """
    # Post-camera violation rate is KEY signal
    post_camera_rate = estimate_post_camera_violation_rate(intersection)
    
    # Coverage gap (normalized, 2km gap = 1.0)
    coverage_gap = intersection.get("coverageGapToNextCameraKm", 0.5)
    coverage_gap_normalized = min(coverage_gap / 2, 1.0)
    
    # Accident history (use risk score as proxy, or derive from accidents)
    accident_score = intersection.get("riskScore", 0.5)
    
    # Traffic tier
    traffic = intersection.get("dailyTrafficVehicles", 15_000)
    traffic_tier = derive_traffic_tier(traffic)
    traffic_factor = traffic_tier_to_numeric(traffic_tier) / 4
    
    # Is unmonitored? Significant penalty (absence of data IS the risk)
    is_monitored = intersection.get("isMonitored", True)
    unmonitored_penalty = 0.15 if not is_monitored else 0
    
    # Weighted combination
    safety_gap = (
        post_camera_rate * 0.35 +           # Post-camera behavior (key signal)
        coverage_gap_normalized * 0.25 +     # Physical coverage gap
        accident_score * 0.20 +              # Historical risk
        traffic_factor * 0.10 +              # Traffic volume
        unmonitored_penalty                  # Unmonitored zone penalty
    )
    
    return min(max(round(safety_gap, 3), 0), 1)


def calculate_camera_roi_score(intersection: dict) -> dict:
    """
    Calculate ROI score for camera installation.
    
    roi_score = (estimated_fine_revenue × 12 - camera_install_cost) / camera_install_cost
    
    Returns dict with component breakdown.
    """
    is_monitored = intersection.get("isMonitored", True)
    
    # Get or estimate violations per month
    if is_monitored:
        violations_per_month = intersection.get("violationsPerMonth", 200)
    else:
        violations_per_month = intersection.get("estimatedViolationsPerMonth", 180)
    
    # Calculate annual fine revenue
    annual_violations = violations_per_month * 12
    gross_fine_revenue = annual_violations * FINE_AVG_TENGE
    net_fine_revenue = gross_fine_revenue * COLLECTION_RATE
    
    # ROI calculation
    install_cost = CAMERA_INSTALL_COST_TENGE
    annual_maintenance = CAMERA_MAINTENANCE_YEARLY_TENGE
    
    # First year ROI (including install)
    first_year_profit = net_fine_revenue - install_cost - annual_maintenance
    roi_score = first_year_profit / install_cost if install_cost > 0 else 0
    
    # Breakeven months
    monthly_revenue = net_fine_revenue / 12
    monthly_maintenance = annual_maintenance / 12
    net_monthly = monthly_revenue - monthly_maintenance
    breakeven_months = install_cost / net_monthly if net_monthly > 0 else 999
    
    return {
        "roi_score": round(roi_score, 2),
        "estimated_annual_revenue_tenge": round(net_fine_revenue),
        "install_cost_tenge": install_cost,
        "annual_maintenance_tenge": annual_maintenance,
        "breakeven_months": round(min(breakeven_months, 36), 1),
        "is_positive_roi": roi_score > 0,
        "violations_per_month_used": violations_per_month,
    }


def score_camera_intersection(intersection: dict) -> dict:
    """
    Score a single camera intersection with all Brain 1 metrics.
    
    Returns enriched intersection with computed scores.
    """
    safety_gap = calculate_camera_safety_gap(intersection)
    roi_data = calculate_camera_roi_score(intersection)
    data_completeness = calculate_camera_data_completeness(intersection)
    traffic_tier = derive_traffic_tier(intersection.get("dailyTrafficVehicles"))
    post_camera_rate = estimate_post_camera_violation_rate(intersection)
    
    is_monitored = intersection.get("isMonitored", True)
    politeness = derive_road_politeness_score(
        intersection.get("violationsPerMonth"),
        intersection.get("dailyTrafficVehicles"),
        is_monitored
    )
    
    # Priority score for cameras (0-100)
    # Weight safety gap heavily, but also consider ROI
    priority_score = (safety_gap * 0.7 + (1 if roi_data["is_positive_roi"] else 0.3) * 0.3) * 100
    
    return {
        "intersection_id": intersection.get("id"),
        "name": intersection.get("name"),
        "road_class": intersection.get("roadClass"),
        "is_monitored": is_monitored,
        "district": _infer_camera_district(intersection),
        
        # Original data (preserved)
        "violations_per_month": intersection.get("violationsPerMonth"),
        "estimated_violations_per_month": intersection.get("estimatedViolationsPerMonth"),
        "accidents_per_year": intersection.get("accidentsPerYear"),
        "daily_traffic_vehicles": intersection.get("dailyTrafficVehicles"),
        "coverage_gap_km": intersection.get("coverageGapToNextCameraKm"),
        "risk_score_original": intersection.get("riskScore"),
        "risk_category_original": intersection.get("riskCategory"),
        "coordinates": intersection.get("coordinates"),
        "notes": intersection.get("notes"),
        "ai_flag": intersection.get("aiFlag"),
        
        # Brain 1 computed scores
        "traffic_tier": traffic_tier,
        "post_camera_violation_rate": post_camera_rate,
        "road_politeness_score": politeness,
        "safety_gap": safety_gap,
        "priority_score": round(priority_score, 1),
        "roi": roi_data,
        "data_completeness_score": round(data_completeness, 2),
        
        # Risk flags
        "is_critical_gap": not is_monitored and intersection.get("coverageGapToNextCameraKm", 0) >= 1.5,
        "is_high_violation_zone": post_camera_rate >= 0.5,
        "is_survivorship_bias_case": not is_monitored and intersection.get("violationsPerMonth") is None,
    }


def _infer_camera_district(intersection: dict) -> str:
    """Infer district from camera location (mock for Almaty)."""
    coords = intersection.get("coordinates", {})
    lat = coords.get("lat", 43.25)
    lng = coords.get("lng", 76.92)
    
    if lat > 43.27:
        return "Turksib"
    elif lat > 43.25:
        if lng < 76.91:
            return "Almaly"
        else:
            return "Zhetysu"
    elif lat > 43.23:
        return "Medeu"
    else:
        return "Bostandyk"


def calculate_all_camera_scores(intersections: list[dict]) -> dict:
    """
    Calculate Brain 1 scores for all camera intersections.
    
    Returns ranked list and aggregate statistics.
    """
    scored_intersections = [score_camera_intersection(inter) for inter in intersections]
    
    # Sort by priority score (descending) — unmonitored zones should rank high
    scored_intersections.sort(key=lambda x: x["priority_score"], reverse=True)
    
    # Add rank
    for rank, inter in enumerate(scored_intersections, 1):
        inter["brain1_rank"] = rank
    
    # Calculate aggregates
    monitored = [i for i in scored_intersections if i["is_monitored"]]
    unmonitored = [i for i in scored_intersections if not i["is_monitored"]]
    
    current_annual_revenue = sum(
        i.get("roi", {}).get("estimated_annual_revenue_tenge", 0)
        for i in monitored
    )
    projected_additional = sum(
        i.get("roi", {}).get("estimated_annual_revenue_tenge", 0)
        for i in unmonitored
    )
    total_new_investment = len(unmonitored) * CAMERA_INSTALL_COST_TENGE
    
    avg_data_completeness = sum(i["data_completeness_score"] for i in scored_intersections) / len(scored_intersections) if scored_intersections else 0
    
    survivorship_bias_count = sum(1 for i in scored_intersections if i["is_survivorship_bias_case"])
    critical_gap_count = sum(1 for i in scored_intersections if i["is_critical_gap"])
    
    return {
        "intersections": scored_intersections,
        "top_3_priority_ids": [i["intersection_id"] for i in scored_intersections[:3]],
        "aggregates": {
            "total_intersections": len(scored_intersections),
            "monitored_count": len(monitored),
            "unmonitored_count": len(unmonitored),
            "survivorship_bias_cases": survivorship_bias_count,
            "critical_gap_count": critical_gap_count,
            "current_annual_revenue_tenge": current_annual_revenue,
            "projected_additional_revenue_tenge": projected_additional,
            "total_new_investment_tenge": total_new_investment,
            "combined_roi_breakeven_months": round(
                total_new_investment / (projected_additional / 12) if projected_additional > 0 else 999,
                1
            ),
            "avg_data_completeness": round(avg_data_completeness, 2),
        },
        "context": {
            "camera_install_cost_tenge": CAMERA_INSTALL_COST_TENGE,
            "fine_avg_tenge": FINE_AVG_TENGE,
            "collection_rate": COLLECTION_RATE,
            "analysis_type": "camera_allocation",
            "survivorship_bias_note": "Unmonitored zones have null violations — this is NOT safety, it's missing data. The coverage gap IS the risk signal.",
        },
    }
