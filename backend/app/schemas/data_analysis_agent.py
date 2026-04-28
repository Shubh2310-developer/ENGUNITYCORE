from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class AnalysisType(str, Enum):
    TREND = "trend"
    COMPARISON = "comparison"
    DISTRIBUTION = "distribution"
    ANOMALY = "anomaly"
    PREDICTION = "prediction"
    SUMMARY = "summary"


class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    SCATTER = "scatter"
    HEATMAP = "heatmap"
    AREA = "area"
    HISTOGRAM = "histogram"
    BOX = "box"


class DataAnalysisRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=1000)
    dataset_id: Optional[int] = Field(default=None, ge=1)
    time_range: str = Field(default="30d", max_length=32)
    data_source: str = Field(default="analytics", max_length=64)

    @field_validator("query")
    @classmethod
    def validate_query(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 5:
            raise ValueError("Query is too short")
        return normalized


class QueryPlan(BaseModel):
    analysis_type: AnalysisType = AnalysisType.SUMMARY
    x_field: Optional[str] = Field(default=None, max_length=128)
    y_field: Optional[str] = Field(default=None, max_length=128)
    group_by: Optional[str] = Field(default=None, max_length=128)
    metric: str = Field(default="count", max_length=32)
    sort: str = Field(default="desc", pattern="^(asc|desc)$")
    limit: int = Field(default=20, ge=1, le=1000)
    operations: List[str] = Field(default_factory=list, max_length=8)


class DataInsight(BaseModel):
    insight_type: str = Field(..., max_length=32)
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=1000)
    confidence: float = Field(..., ge=0.0, le=1.0)
    data_points: Optional[List[Dict[str, Any]]] = Field(default=None, max_length=100)


class ChartConfig(BaseModel):
    chart_type: ChartType
    title: str = Field(..., max_length=255)
    x_label: str = Field(..., max_length=128)
    y_label: str = Field(..., max_length=128)
    data: List[Dict[str, Any]] = Field(default_factory=list, max_length=1000)
    colors: Optional[List[str]] = Field(default=None, max_length=20)


class DataAnalysisResponse(BaseModel):
    query: str
    analysis_type: AnalysisType
    summary: str = Field(..., max_length=2000)
    insights: List[DataInsight] = Field(default_factory=list, max_length=20)
    chart: Optional[ChartConfig] = None
    raw_data: Optional[List[Dict[str, Any]]] = Field(default=None, max_length=100)
    suggested_queries: List[str] = Field(default_factory=list, max_length=5)
    processing_time: float = Field(..., ge=0.0)
