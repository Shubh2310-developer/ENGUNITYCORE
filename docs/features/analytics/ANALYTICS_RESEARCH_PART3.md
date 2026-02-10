# Analytics Dashboard - Implementation Guide (Part 3)

**Date:** January 18, 2026  
**Continuation of:** ANALYTICS_RESEARCH_PART2.md

---

## 🛠️ Backend Implementation

### 1. Database Models

#### Create Analytics Models
```python
# backend/app/models/analytics.py

from sqlalchemy import Column, Integer, String, Text, BigInteger, Float, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime

class AnalyticsDataset(Base):
    __tablename__ = "analytics_datasets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    source_type = Column(String(50))  # 'csv', 'excel', 'json', 'api'
    file_path = Column(Text)  # Supabase storage path
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    file_size = Column(BigInteger)  # bytes
    status = Column(String(50), default='uploaded')  # 'uploaded', 'processing', 'ready', 'error'
    error_message = Column(Text)
    metadata = Column(JSONB)  # Column info, summary stats
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="datasets")
    analyses = relationship("AnalyticsAnalysis", back_populates="dataset", cascade="all, delete-orphan")
    charts = relationship("AnalyticsChart", back_populates="dataset", cascade="all, delete-orphan")

class AnalyticsAnalysis(Base):
    __tablename__ = "analytics_analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("analytics_datasets.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    analysis_type = Column(String(50))  # 'statistical', 'ml', 'correlation'
    configuration = Column(JSONB)  # Parameters
    results = Column(JSONB)  # Results
    status = Column(String(50), default='pending')
    execution_time = Column(Float)  # seconds
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    completed_at = Column(TIMESTAMP)
    
    # Relationships
    dataset = relationship("AnalyticsDataset", back_populates="analyses")
    user = relationship("User")

class AnalyticsChart(Base):
    __tablename__ = "analytics_charts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("analytics_datasets.id", ondelete="CASCADE"))
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analytics_analyses.id", ondelete="SET NULL"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    chart_type = Column(String(50))  # 'line', 'bar', 'pie', etc.
    configuration = Column(JSONB)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    dataset = relationship("AnalyticsDataset", back_populates="charts")
    user = relationship("User")

class AnalyticsDashboard(Base):
    __tablename__ = "analytics_dashboards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    layout = Column(JSONB)  # Grid layout
    is_public = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    widgets = relationship("AnalyticsDashboardWidget", back_populates="dashboard", cascade="all, delete-orphan")

class AnalyticsDashboardWidget(Base):
    __tablename__ = "analytics_dashboard_widgets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dashboard_id = Column(UUID(as_uuid=True), ForeignKey("analytics_dashboards.id", ondelete="CASCADE"))
    widget_type = Column(String(50))  # 'chart', 'metric', 'table'
    chart_id = Column(UUID(as_uuid=True), ForeignKey("analytics_charts.id", ondelete="SET NULL"))
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("analytics_datasets.id", ondelete="SET NULL"))
    configuration = Column(JSONB)
    position = Column(JSONB)  # {x, y, w, h}
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    
    # Relationships
    dashboard = relationship("AnalyticsDashboard", back_populates="widgets")
```

### 2. Pydantic Schemas

```python
# backend/app/schemas/analytics.py

from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

# Dataset Schemas
class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None

class DatasetCreate(DatasetBase):
    source_type: str = 'csv'

class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class Dataset(DatasetBase):
    id: UUID
    user_id: int
    source_type: str
    file_path: Optional[str]
    row_count: int
    column_count: int
    file_size: Optional[int]
    status: str
    error_message: Optional[str]
    metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DatasetWithData(Dataset):
    data: List[Dict[str, Any]]
    columns: List[Dict[str, Any]]

# Analysis Schemas
class AnalysisCreate(BaseModel):
    dataset_id: UUID
    name: str
    analysis_type: str
    configuration: Dict[str, Any]

class Analysis(BaseModel):
    id: UUID
    dataset_id: UUID
    user_id: int
    name: str
    analysis_type: str
    configuration: Dict[str, Any]
    results: Optional[Dict[str, Any]]
    status: str
    execution_time: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)

# Chart Schemas
class ChartCreate(BaseModel):
    dataset_id: UUID
    name: str
    chart_type: str
    configuration: Dict[str, Any]

class Chart(BaseModel):
    id: UUID
    dataset_id: UUID
    user_id: int
    name: str
    chart_type: str
    configuration: Dict[str, Any]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Statistics Response
class ColumnStatistics(BaseModel):
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    min: Optional[float] = None
    max: Optional[float] = None
    quartiles: Optional[List[float]] = None
    unique_count: Optional[int] = None
    null_count: Optional[int] = None
    top_values: Optional[List[Dict[str, Any]]] = None

class DatasetStatistics(BaseModel):
    numeric_columns: Dict[str, ColumnStatistics]
    categorical_columns: Dict[str, ColumnStatistics]
    row_count: int
    column_count: int
```

### 3. Data Processing Service

```python
# backend/app/services/analytics/data_processor.py

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
import io
from sqlalchemy.orm import Session

class DataProcessor:
    """Service for processing uploaded data files"""
    
    @staticmethod
    async def process_csv(file_content: bytes, filename: str) -> Dict[str, Any]:
        """Process CSV file and extract metadata"""
        try:
            df = pd.read_csv(io.BytesIO(file_content))
            return DataProcessor._extract_dataframe_metadata(df, filename)
        except Exception as e:
            raise ValueError(f"Error processing CSV: {str(e)}")
    
    @staticmethod
    async def process_excel(file_content: bytes, filename: str) -> Dict[str, Any]:
        """Process Excel file"""
        try:
            df = pd.read_excel(io.BytesIO(file_content))
            return DataProcessor._extract_dataframe_metadata(df, filename)
        except Exception as e:
            raise ValueError(f"Error processing Excel: {str(e)}")
    
    @staticmethod
    async def process_json(file_content: bytes, filename: str) -> Dict[str, Any]:
        """Process JSON file"""
        try:
            df = pd.read_json(io.BytesIO(file_content))
            return DataProcessor._extract_dataframe_metadata(df, filename)
        except Exception as e:
            raise ValueError(f"Error processing JSON: {str(e)}")
    
    @staticmethod
    def _extract_dataframe_metadata(df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """Extract metadata from DataFrame"""
        columns = []
        for col in df.columns:
            col_info = {
                "name": col,
                "type": str(df[col].dtype),
                "nullable": bool(df[col].isnull().any()),
                "unique_count": int(df[col].nunique()),
                "null_count": int(df[col].isnull().sum())
            }
            
            # Add stats for numeric columns
            if pd.api.types.is_numeric_dtype(df[col]):
                col_info.update({
                    "min": float(df[col].min()) if not df[col].isnull().all() else None,
                    "max": float(df[col].max()) if not df[col].isnull().all() else None,
                    "mean": float(df[col].mean()) if not df[col].isnull().all() else None,
                    "std": float(df[col].std()) if not df[col].isnull().all() else None
                })
            
            columns.append(col_info)
        
        # Convert DataFrame to list of dicts
        data_records = df.to_dict('records')
        
        return {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": columns,
            "data": data_records,
            "filename": filename
        }
    
    @staticmethod
    async def compute_statistics(df: pd.DataFrame) -> Dict[str, Any]:
        """Compute comprehensive statistics"""
        numeric_stats = {}
        categorical_stats = {}
        
        # Numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            numeric_stats[col] = {
                "mean": float(df[col].mean()),
                "median": float(df[col].median()),
                "std": float(df[col].std()),
                "min": float(df[col].min()),
                "max": float(df[col].max()),
                "quartiles": [
                    float(df[col].quantile(0.25)),
                    float(df[col].quantile(0.50)),
                    float(df[col].quantile(0.75))
                ],
                "null_count": int(df[col].isnull().sum())
            }
        
        # Categorical columns
        categorical_cols = df.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            value_counts = df[col].value_counts().head(10)
            categorical_stats[col] = {
                "unique_count": int(df[col].nunique()),
                "null_count": int(df[col].isnull().sum()),
                "top_values": [
                    {"value": str(k), "count": int(v)}
                    for k, v in value_counts.items()
                ]
            }
        
        return {
            "numeric_columns": numeric_stats,
            "categorical_columns": categorical_stats,
            "row_count": len(df),
            "column_count": len(df.columns)
        }
    
    @staticmethod
    async def compute_correlation(df: pd.DataFrame, method: str = 'pearson', 
                                  columns: Optional[List[str]] = None) -> Dict[str, Any]:
        """Compute correlation matrix"""
        if columns:
            df_corr = df[columns]
        else:
            df_corr = df.select_dtypes(include=[np.number])
        
        if df_corr.empty:
            raise ValueError("No numeric columns found for correlation")
        
        corr_matrix = df_corr.corr(method=method)
        
        return {
            "correlation_matrix": corr_matrix.values.tolist(),
            "columns": corr_matrix.columns.tolist(),
            "method": method
        }

data_processor = DataProcessor()
```

### 4. Machine Learning Service

```python
# backend/app/services/analytics/ml_service.py

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
from typing import Dict, Any, List
import tempfile
import os

class MLService:
    """Machine Learning service for analytics"""
    
    REGRESSION_MODELS = {
        'linear_regression': LinearRegression,
        'random_forest': RandomForestRegressor
    }
    
    CLASSIFICATION_MODELS = {
        'logistic_regression': LogisticRegression,
        'random_forest': RandomForestClassifier
    }
    
    @staticmethod
    async def train_model(
        df: pd.DataFrame,
        model_type: str,
        algorithm: str,
        target_column: str,
        feature_columns: List[str],
        parameters: Dict[str, Any] = None,
        test_size: float = 0.2
    ) -> Dict[str, Any]:
        """Train a machine learning model"""
        
        # Prepare data
        X = df[feature_columns]
        y = df[target_column]
        
        # Handle missing values
        X = X.fillna(X.mean() if X.select_dtypes(include=[np.number]).columns.tolist() else X.mode().iloc[0])
        y = y.fillna(y.mean() if pd.api.types.is_numeric_dtype(y) else y.mode().iloc[0])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Select model
        if model_type == 'regression':
            ModelClass = MLService.REGRESSION_MODELS.get(algorithm)
        elif model_type == 'classification':
            ModelClass = MLService.CLASSIFICATION_MODELS.get(algorithm)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        if ModelClass is None:
            raise ValueError(f"Unknown algorithm: {algorithm}")
        
        # Initialize model with parameters
        model = ModelClass(**parameters) if parameters else ModelClass()
        
        # Train model
        import time
        start_time = time.time()
        model.fit(X_train, y_train)
        execution_time = time.time() - start_time
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        if model_type == 'regression':
            metrics = {
                'r2_score': float(r2_score(y_test, y_pred)),
                'mse': float(mean_squared_error(y_test, y_pred)),
                'rmse': float(np.sqrt(mean_squared_error(y_test, y_pred))),
                'mae': float(mean_absolute_error(y_test, y_pred))
            }
        else:
            metrics = {
                'accuracy': float(accuracy_score(y_test, y_pred)),
                'precision': float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
                'recall': float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
                'f1_score': float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
            }
        
        # Feature importance (if available)
        feature_importance = {}
        if hasattr(model, 'feature_importances_'):
            for feat, importance in zip(feature_columns, model.feature_importances_):
                feature_importance[feat] = float(importance)
        elif hasattr(model, 'coef_'):
            for feat, coef in zip(feature_columns, model.coef_):
                feature_importance[feat] = float(abs(coef))
        
        # Save model
        model_path = tempfile.mktemp(suffix='.pkl')
        joblib.dump(model, model_path)
        
        return {
            'model_type': model_type,
            'algorithm': algorithm,
            'metrics': metrics,
            'feature_importance': feature_importance,
            'execution_time': execution_time,
            'train_size': len(X_train),
            'test_size': len(X_test),
            'predictions': y_pred.tolist()[:100],  # First 100 predictions
            'model_path': model_path
        }
    
    @staticmethod
    async def make_predictions(model_path: str, data: List[Dict[str, Any]]) -> List[float]:
        """Make predictions using a trained model"""
        model = joblib.load(model_path)
        df = pd.DataFrame(data)
        predictions = model.predict(df)
        return predictions.tolist()

ml_service = MLService()
```

---

**Continue to Part 4 for API Implementation and Frontend...**
