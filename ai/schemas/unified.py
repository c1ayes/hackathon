"""
Unified Pydantic Schemas for Smart City AI Pipeline

Models for Brain 1 output, Brain 2 output, and merged responses.
"""

from typing import Literal, Optional
from pydantic import BaseModel, Field


# === BRAIN 1 SCHEMAS ===


class FinancialImpact(BaseModel):
    """Financial impact breakdown for a road segment."""
    total_impact_tenge: int
    repair_cost_delta_tenge: int
    economic_loss_delta_tenge: int
    estimated_days_until_failure: int
    economic_value_per_day_tenge: int
    disruption_multiplier: float


class Coordinates(BaseModel):
    """Geographic coordinates."""
    lat: float
    lng: float


class Brain1RoadSegment(BaseModel):
    """Brain 1 scored road segment."""
    segment_id: str
    name: str
    road_class: Optional[str] = None
    district: str
    
    # Original data
    defects_per_100m: Optional[int] = None
    daily_traffic_vehicles: Optional[int] = None
    truck_share_percent: Optional[float] = None
    freeze_exposure_score: Optional[float] = None
    current_severity: Optional[str] = None
    fix_cost_tenge: Optional[int] = None
    emergency_cost_tenge: Optional[int] = None
    failure_probability_12mo: Optional[float] = None
    original_priority_rank: Optional[int] = None
    coordinates: Optional[Coordinates] = None
    notes: Optional[str] = None
    
    # Brain 1 computed
    traffic_tier: Literal["low", "medium", "high", "arterial"]
    truck_damage_factor: float
    road_pressure: float = Field(ge=0, le=1)
    priority_score: float = Field(ge=0, le=100)
    financial_impact: FinancialImpact
    data_completeness_score: float = Field(ge=0, le=1)
    brain1_rank: int
    
    # Flags
    is_high_freeze_risk: bool
    is_truck_heavy: bool
    is_critical: bool


class Brain1RoadAggregates(BaseModel):
    """Aggregate statistics for all road segments."""
    total_segments: int
    critical_count: int
    high_freeze_risk_count: int
    truck_heavy_count: int
    total_fix_cost_tenge: int
    total_emergency_cost_tenge: int
    total_potential_savings_tenge: int
    avg_data_completeness: float
    top_3_combined_financial_impact_tenge: int


class Brain1RoadsOutput(BaseModel):
    """Complete Brain 1 roads analysis output."""
    segments: list[Brain1RoadSegment]
    top_3_priority_ids: list[str]
    aggregates: Brain1RoadAggregates
    context: dict


class CameraROI(BaseModel):
    """ROI calculation for camera installation."""
    roi_score: float
    estimated_annual_revenue_tenge: int
    install_cost_tenge: int
    annual_maintenance_tenge: int
    breakeven_months: float
    is_positive_roi: bool
    violations_per_month_used: int


class AIFlag(BaseModel):
    """AI-generated flag for an intersection."""
    priority: str
    reason: str
    recommendation: str


class Brain1CameraZone(BaseModel):
    """Brain 1 scored camera intersection."""
    intersection_id: str
    name: str
    road_class: Optional[str] = None
    is_monitored: bool
    district: str
    
    # Original data
    violations_per_month: Optional[int] = None
    estimated_violations_per_month: Optional[int] = None
    accidents_per_year: Optional[int] = None
    daily_traffic_vehicles: Optional[int] = None
    coverage_gap_km: Optional[float] = None
    risk_score_original: Optional[float] = None
    risk_category_original: Optional[str] = None
    coordinates: Optional[Coordinates] = None
    notes: Optional[str] = None
    ai_flag: Optional[AIFlag] = None
    
    # Brain 1 computed
    traffic_tier: Literal["low", "medium", "high", "arterial"]
    post_camera_violation_rate: float
    road_politeness_score: Optional[float] = None
    safety_gap: float = Field(ge=0, le=1)
    priority_score: float = Field(ge=0, le=100)
    roi: CameraROI
    data_completeness_score: float = Field(ge=0, le=1)
    brain1_rank: int
    
    # Flags
    is_critical_gap: bool
    is_high_violation_zone: bool
    is_survivorship_bias_case: bool


class Brain1CameraAggregates(BaseModel):
    """Aggregate statistics for all camera zones."""
    total_intersections: int
    monitored_count: int
    unmonitored_count: int
    survivorship_bias_cases: int
    critical_gap_count: int
    current_annual_revenue_tenge: int
    projected_additional_revenue_tenge: int
    total_new_investment_tenge: int
    combined_roi_breakeven_months: float
    avg_data_completeness: float


class Brain1CamerasOutput(BaseModel):
    """Complete Brain 1 cameras analysis output."""
    intersections: list[Brain1CameraZone]
    top_3_priority_ids: list[str]
    aggregates: Brain1CameraAggregates
    context: dict


# === BRAIN 2 SCHEMAS ===


class RoadEnrichment(BaseModel):
    """Brain 2 enrichment for a road segment."""
    segment_id: str
    hidden_risks: str
    urgency_adjustment: Literal["higher", "lower", "unchanged"]
    reasoning: str
    seasonal_note: Optional[str] = None


class CameraEnrichment(BaseModel):
    """Brain 2 enrichment for a camera zone."""
    intersection_id: str
    hidden_risks: str
    urgency_adjustment: Literal["higher", "lower", "unchanged"]
    reasoning: str
    survivorship_bias_note: Optional[str] = None


class Brain2Enrichment(BaseModel):
    """Brain 2 enrichment output for all analyzed entities."""
    roads: list[RoadEnrichment]
    cameras: list[CameraEnrichment]


class Brain2Overlap(BaseModel):
    """Cross-domain overlap detection result."""
    road_segment: str
    camera_zone: str
    overlap_exists: bool
    overlap_type: Optional[Literal["geographic", "corridor", "causal"]] = None
    causal_explanation: Optional[str] = None
    compounding_risk: Optional[str] = None
    recommendation: Optional[str] = None


class Brain2AnomalyTypeA(BaseModel):
    """Within-data anomaly (unexpected score given inputs)."""
    entity: str
    entity_type: Literal["road", "camera"]
    observation: str
    likely_explanation: str
    confidence_pct: int = Field(ge=0, le=100)


class Brain2AnomalyTypeB(BaseModel):
    """Data quality anomaly (implausible input combinations)."""
    entity: str
    entity_type: Literal["road", "camera"]
    suspicious_pattern: str
    why_implausible: str
    expected_correct_data: str


class Brain2Anomalies(BaseModel):
    """All anomalies detected by Brain 2."""
    type_a: list[Brain2AnomalyTypeA]
    type_b: list[Brain2AnomalyTypeB]


class Brain2OverallConfidence(BaseModel):
    """Overall confidence score with calculation transparency."""
    score_pct: int = Field(ge=0, le=100)
    calculation_basis: str
    interpretation: str


class Brain2Output(BaseModel):
    """Complete Brain 2 LLM analysis output."""
    enrichment: Brain2Enrichment
    overlaps: list[Brain2Overlap]
    anomalies: Brain2Anomalies
    overall_confidence: Brain2OverallConfidence


# === UNIFIED RESPONSE SCHEMAS ===


class KeyInsights(BaseModel):
    """Summary of key insights from Brain 2 analysis."""
    urgent_road_count: int
    urgent_camera_count: int
    overlap_count: int
    type_a_anomaly_count: int
    type_b_anomaly_count: int
    overall_confidence_pct: int
    has_data_quality_issues: bool
    has_cross_domain_insights: bool


class UnifiedAnalysisRequest(BaseModel):
    """Request for unified analysis."""
    context: Optional[str] = None
    top_n: int = Field(default=3, ge=1, le=10)
    include_full_brain1: bool = True


class UnifiedAnalysisResponse(BaseModel):
    """Complete unified analysis response merging Brain 1 and Brain 2."""
    brain1_roads: Brain1RoadsOutput
    brain1_cameras: Brain1CamerasOutput
    brain2: Brain2Output
    key_insights: KeyInsights
    analysis_metadata: dict


# === BACKWARD COMPATIBILITY SCHEMAS ===


class LegacyRoadsAnalyzeRequest(BaseModel):
    """Legacy request format for /analyze/roads."""
    context: Optional[str] = None


class LegacyRoadsAnalyzeResponse(BaseModel):
    """Legacy response format for /analyze/roads."""
    title: str
    summary: str
    top_priority_segments: list[str]
    total_savings_if_fixed_now_tenge: Optional[int] = None
    recommendations: list[str]
    confidence: Optional[float] = None
    # New fields (additive, backward compatible)
    data_completeness_score: Optional[float] = None
    hidden_risks: Optional[list[str]] = None


class LegacyCamerasAnalyzeRequest(BaseModel):
    """Legacy request format for /analyze/cameras."""
    context: Optional[str] = None


class LegacyCamerasAnalyzeResponse(BaseModel):
    """Legacy response format for /analyze/cameras."""
    title: str
    summary: str
    top_priority_installs: list[str]
    projected_additional_revenue_tenge: Optional[int] = None
    recommendations: list[str]
    confidence: Optional[float] = None
    # New fields (additive, backward compatible)
    data_completeness_score: Optional[float] = None
    survivorship_bias_flags: Optional[list[str]] = None
