from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class District(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    budget_total: Mapped[float] = mapped_column(Float, nullable=False)
    budget_available: Mapped[float] = mapped_column(Float, nullable=False)

    segments: Mapped[list["RoadSegment"]] = relationship("RoadSegment", back_populates="district")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    district_id: Mapped[int] = mapped_column(ForeignKey("districts.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    road_class: Mapped[str] = mapped_column(String(80), nullable=False)
    center_lat: Mapped[float] = mapped_column(Float, nullable=False)
    center_lng: Mapped[float] = mapped_column(Float, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False)
    defect_score: Mapped[float] = mapped_column(Float, nullable=False)
    traffic_volume: Mapped[int] = mapped_column(Integer, nullable=False)
    seasonal_decay_rate: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_fix_now_cost: Mapped[float] = mapped_column(Float, nullable=False)
    estimated_emergency_cost: Mapped[float] = mapped_column(Float, nullable=False)
    camera_coverage_score: Mapped[float] = mapped_column(Float, nullable=False)
    accident_risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    district: Mapped["District"] = relationship("District", back_populates="segments")
    cameras: Mapped[list["Camera"]] = relationship("Camera", back_populates="segment")
    recommendations: Mapped[list["Recommendation"]] = relationship(
        "Recommendation", back_populates="segment"
    )


class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    segment_id: Mapped[int] = mapped_column(ForeignKey("road_segments.id"), nullable=False)
    location_name: Mapped[str] = mapped_column(String(200), nullable=False)
    violation_count: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    coverage_radius: Mapped[float] = mapped_column(Float, nullable=False)

    segment: Mapped["RoadSegment"] = relationship("RoadSegment", back_populates="cameras")


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    segment_id: Mapped[int] = mapped_column(ForeignKey("road_segments.id"), nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(50), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    priority_score: Mapped[float] = mapped_column(Float, nullable=False)
    prompt_version: Mapped[str] = mapped_column(String(20), nullable=False)
    raw_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    raw_ai_response: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    segment: Mapped["RoadSegment"] = relationship("RoadSegment", back_populates="recommendations")
    actions: Mapped[list["RecommendedAction"]] = relationship(
        "RecommendedAction", back_populates="recommendation", cascade="all, delete-orphan"
    )


class RecommendedAction(Base):
    __tablename__ = "recommended_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recommendation_id: Mapped[int] = mapped_column(ForeignKey("recommendations.id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    urgency: Mapped[str] = mapped_column(String(30), nullable=False)
    location_label: Mapped[str] = mapped_column(String(255), nullable=False)
    effect_text: Mapped[str] = mapped_column(Text, nullable=False)
    financial_impact: Mapped[float] = mapped_column(Float, nullable=False)
    risk_reduction: Mapped[float] = mapped_column(Float, nullable=False)
    time_horizon: Mapped[str] = mapped_column(String(50), nullable=False)
    implementation_cost: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="suggested", nullable=False)

    recommendation: Mapped["Recommendation"] = relationship(
        "Recommendation", back_populates="actions"
    )
    forecasts: Mapped[list["ActionForecast"]] = relationship(
        "ActionForecast", back_populates="action", cascade="all, delete-orphan"
    )


class ActionForecast(Base):
    __tablename__ = "action_forecasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recommended_action_id: Mapped[int] = mapped_column(
        ForeignKey("recommended_actions.id"), nullable=False
    )
    selected_by_user: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    forecast_summary: Mapped[str] = mapped_column(Text, nullable=False)
    projected_savings: Mapped[float] = mapped_column(Float, nullable=False)
    projected_revenue: Mapped[float] = mapped_column(Float, nullable=False)
    projected_accident_reduction: Mapped[float] = mapped_column(Float, nullable=False)
    projected_risk_change: Mapped[float] = mapped_column(Float, nullable=False)
    raw_ai_response: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    action: Mapped["RecommendedAction"] = relationship(
        "RecommendedAction", back_populates="forecasts"
    )
