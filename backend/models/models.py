from datetime import datetime
from typing import Optional
from repositories.database import Base

from sqlalchemy import (
    String,
    Integer,
    Float,
    ForeignKey,
    DateTime,
    Text,
    Boolean,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

class DistrictModel(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    status: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    mood_index: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    pollution_index: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    traffic_index: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    complaints_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Если будешь делать схематичную карту
    x: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    y: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    reports: Mapped[list["ReportModel"]] = relationship(
        back_populates="district",
        cascade="all, delete-orphan",
    )
    snapshots: Mapped[list["DistrictSnapshotModel"]] = relationship(
        back_populates="district",
        cascade="all, delete-orphan",
    )
    ai_insights: Mapped[list["AIInsightModel"]] = relationship(
        back_populates="district",
        cascade="all, delete-orphan",
    )
    actions: Mapped[list["ActionModel"]] = relationship(
        back_populates="district",
        cascade="all, delete-orphan",
    )


class ReportModel(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    source: Mapped[str] = mapped_column(String(50), nullable=False)  
    # examples: threads, instagram, 2gis, form, news

    district_id: Mapped[int] = mapped_column(
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    category: Mapped[str] = mapped_column(String(50), nullable=False)
    # examples: traffic, ecology, housing, safety

    text: Mapped[str] = mapped_column(Text, nullable=False)

    sentiment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    severity_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    district: Mapped["DistrictModel"] = relationship(back_populates="reports")


class DistrictSnapshotModel(Base):
    __tablename__ = "district_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    district_id: Mapped[int] = mapped_column(
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    complaints_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    negative_reports_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    traffic_index: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    pollution_index: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    mood_index: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)

    top_category: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    district: Mapped["DistrictModel"] = relationship(back_populates="snapshots")


class AIInsightModel(Base):
    __tablename__ = "ai_insights"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    district_id: Mapped[int] = mapped_column(
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    possible_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    forecast: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # список рекомендаций удобно хранить JSON-массивом
    recommendations: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    district: Mapped["DistrictModel"] = relationship(back_populates="ai_insights")


class ActionModel(Base):
    __tablename__ = "actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    district_id: Mapped[int] = mapped_column(
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    action_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # examples: close_road, send_inspection, alert_citizens

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    district: Mapped["DistrictModel"] = relationship(back_populates="actions")
    simulation_results: Mapped[list["SimulationResultModel"]] = relationship(
        back_populates="action",
        cascade="all, delete-orphan",
    )


class SimulationResultModel(Base):
    __tablename__ = "simulation_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    action_id: Mapped[int] = mapped_column(
        ForeignKey("actions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    before_risk: Mapped[float] = mapped_column(Float, nullable=False)
    after_risk: Mapped[float] = mapped_column(Float, nullable=False)

    before_mood: Mapped[float] = mapped_column(Float, nullable=False)
    after_mood: Mapped[float] = mapped_column(Float, nullable=False)

    before_traffic: Mapped[float] = mapped_column(Float, nullable=False)
    after_traffic: Mapped[float] = mapped_column(Float, nullable=False)

    before_pollution: Mapped[float] = mapped_column(Float, nullable=False)
    after_pollution: Mapped[float] = mapped_column(Float, nullable=False)

    effect_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    action: Mapped["ActionModel"] = relationship(back_populates="simulation_results")