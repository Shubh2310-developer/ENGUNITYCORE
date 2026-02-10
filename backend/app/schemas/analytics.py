from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class DatasetStatus(str, Enum):
    UPLOADING = "uploading"
    PROCESSING = "processing"
    READY = "ready"
    ERROR = "error"


class AnalysisType(str, Enum):
    DESCRIPTIVE = "descriptive"
    CORRELATION = "correlation"
    REGRESSION = "regression"
    CLASSIFICATION = "classification"
    CLUSTERING = "clustering"
    TIME_SERIES = "time_series"


class ChartType(str, Enum):
    LINE = "line"
    BAR = "bar"
    PIE = "pie"
    SCATTER = "scatter"
    HISTOGRAM = "histogram"
    HEATMAP = "heatmap"
    BOX = "box"
    AREA = "area"
    COLUMN = "column"
    DONUT = "donut"


# ==================== Dataset Schemas ====================

class DatasetCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None


class DatasetUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None


class ColumnInfo(BaseModel):
    name: str
    dtype: str
    null_count: int
    unique_count: Optional[int] = None
    sample_values: Optional[List[Any]] = None


class Dataset(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    file_name: str
    file_type: str
    file_size: int
    storage_path: str
    row_count: Optional[int] = None
    column_count: Optional[int] = None
    columns_info: Optional[List[Dict[str, Any]]] = None
    status: DatasetStatus
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DatasetWithData(Dataset):
    data: List[Dict[str, Any]]


class DatasetStatistics(BaseModel):
    dataset_id: int
    summary: Dict[str, Any]
    numeric_stats: Optional[Dict[str, Any]] = None
    categorical_stats: Optional[Dict[str, Any]] = None
    missing_values: Dict[str, int]
    correlations: Optional[Dict[str, Any]] = None


# ==================== Analysis Schemas ====================

class AnalysisCreate(BaseModel):
    name: str = Field(..., max_length=255)
    analysis_type: AnalysisType
    parameters: Optional[Dict[str, Any]] = None


class AnalysisUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    parameters: Optional[Dict[str, Any]] = None


class Analysis(BaseModel):
    id: int
    dataset_id: int
    user_id: int
    name: str
    analysis_type: AnalysisType
    parameters: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== Chart Schemas ====================

class ChartCreate(BaseModel):
    name: str = Field(..., max_length=255)
    chart_type: ChartType
    config: Dict[str, Any]
    analysis_id: Optional[int] = None


class ChartUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    config: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None


class Chart(BaseModel):
    id: int
    dataset_id: int
    analysis_id: Optional[int] = None
    user_id: int
    name: str
    chart_type: ChartType
    config: Dict[str, Any]
    data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== Dashboard Schemas ====================

class DashboardCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    layout: Optional[Dict[str, Any]] = None


class DashboardUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    layout: Optional[Dict[str, Any]] = None


class WidgetPosition(BaseModel):
    x: int
    y: int
    w: int
    h: int


class DashboardWidgetCreate(BaseModel):
    chart_id: int
    position: WidgetPosition


class DashboardWidget(BaseModel):
    id: int
    dashboard_id: int
    chart_id: int
    position: Dict[str, int]
    created_at: datetime

    class Config:
        from_attributes = True


class Dashboard(BaseModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    layout: Optional[Dict[str, Any]] = None
    is_default: int
    created_at: datetime
    updated_at: datetime
    widgets: List[DashboardWidget] = []

    class Config:
        from_attributes = True


# ==================== Session Schemas ====================

class AnalysisSessionCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    dataset_id: Optional[int] = None
    data_summary: Optional[Dict[str, Any]] = None
    column_metadata: Optional[List[Dict[str, Any]]] = None
    data_preview: Optional[Dict[str, Any]] = None
    charts_data: Optional[Dict[str, Any]] = None
    correlation_data: Optional[Dict[str, Any]] = None
    query_history: Optional[List[Dict[str, Any]]] = None
    ai_insights: Optional[List[Dict[str, Any]]] = None
    custom_charts: Optional[List[Dict[str, Any]]] = None
    file_info: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_public: int = 0


class AnalysisSessionUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    data_summary: Optional[Dict[str, Any]] = None
    column_metadata: Optional[List[Dict[str, Any]]] = None
    data_preview: Optional[Dict[str, Any]] = None
    charts_data: Optional[Dict[str, Any]] = None
    correlation_data: Optional[Dict[str, Any]] = None
    query_history: Optional[List[Dict[str, Any]]] = None
    ai_insights: Optional[List[Dict[str, Any]]] = None
    custom_charts: Optional[List[Dict[str, Any]]] = None
    file_info: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_public: Optional[int] = None


class AnalysisSession(BaseModel):
    id: int
    user_id: int
    dataset_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    data_summary: Optional[Dict[str, Any]] = None
    column_metadata: Optional[List[Dict[str, Any]]] = None
    data_preview: Optional[Dict[str, Any]] = None
    charts_data: Optional[Dict[str, Any]] = None
    correlation_data: Optional[Dict[str, Any]] = None
    query_history: Optional[List[Dict[str, Any]]] = None
    ai_insights: Optional[List[Dict[str, Any]]] = None
    custom_charts: Optional[List[Dict[str, Any]]] = None
    file_info: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_public: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== ML Schemas ====================

class RegressionRequest(BaseModel):
    target_column: str
    feature_columns: List[str]
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    model_type: str = Field(default="linear", pattern="^(linear|ridge|lasso|elasticnet|random_forest|gradient_boosting)$")


class ClassificationRequest(BaseModel):
    target_column: str
    feature_columns: List[str]
    test_size: float = Field(default=0.2, ge=0.1, le=0.5)
    model_type: str = Field(default="logistic", pattern="^(logistic|decision_tree|random_forest|svm|gradient_boosting)$")


class ClusteringRequest(BaseModel):
    feature_columns: List[str]
    n_clusters: int = Field(default=3, ge=2, le=10)
    algorithm: str = Field(default="kmeans", pattern="^(kmeans|dbscan|hierarchical)$")


class PredictionRequest(BaseModel):
    input_data: Dict[str, Any]


# ==================== Export Schemas ====================

class ExportFormat(str, Enum):
    CSV = "csv"
    EXCEL = "excel"
    JSON = "json"
    PDF = "pdf"


class ExportRequest(BaseModel):
    format: ExportFormat
    include_charts: bool = False
    chart_ids: Optional[List[int]] = None
