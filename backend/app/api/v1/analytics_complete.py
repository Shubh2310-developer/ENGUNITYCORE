from typing import Any, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
import pandas as pd
import numpy as np
import io
from datetime import datetime

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.analytics import (
    AnalyticsDataset, AnalyticsAnalysis, AnalyticsChart,
    AnalyticsDashboard, AnalyticsDashboardWidget, AnalyticsSession,
    DatasetStatus, AnalysisType, ChartType
)
from app.schemas.analytics import (
    Dataset, DatasetCreate, DatasetWithData, DatasetStatistics,
    Analysis, AnalysisCreate,
    Chart, ChartCreate, ChartUpdate,
    Dashboard, DashboardCreate, DashboardUpdate,
    DashboardWidget, DashboardWidgetCreate,
    AnalysisSession as AnalysisSessionSchema, AnalysisSessionCreate, AnalysisSessionUpdate,
    RegressionRequest, ClassificationRequest, ClusteringRequest, PredictionRequest,
    ExportRequest, ExportFormat
)
from app.schemas.data_analysis_agent import DataAnalysisRequest, DataAnalysisResponse
from app.services.analytics.data_processor import data_processor
from app.services.analytics.ml_service import ml_service
from app.services.analytics.data_analysis_agent_service import (
    DataAnalysisError,
    data_analysis_agent_service,
)
from app.services.storage.supabase import storage_service
import os

router = APIRouter()

# Storage directory for analytics datasets
ANALYTICS_STORAGE_DIR = "app/storage/analytics"
os.makedirs(ANALYTICS_STORAGE_DIR, exist_ok=True)


# ==================== Dataset Management ====================

@router.post("/datasets/upload", response_model=Dataset)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Query(...),
    description: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a new dataset"""
    try:
        # Validate file type
        file_ext = file.filename.split('.')[-1].lower()
        if file_ext not in ['csv', 'xlsx', 'xls', 'json']:
            raise HTTPException(status_code=400, detail="Unsupported file type. Use CSV, Excel, or JSON")
        
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Create dataset record
        dataset = AnalyticsDataset(
            user_id=current_user.id,
            name=name,
            description=description,
            file_name=file.filename,
            file_type=file_ext,
            file_size=file_size,
            storage_path=f"analytics/{current_user.id}/{file.filename}",
            status=DatasetStatus.PROCESSING
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        # Process dataset asynchronously
        try:
            # Read into DataFrame
            df = await data_processor.read_file(content, file_ext)
            
            # Get column information
            columns_info = data_processor.get_column_info(df)
            
            # Update dataset with metadata
            dataset.row_count = len(df)
            dataset.column_count = len(df.columns)
            dataset.columns_info = columns_info
            dataset.status = DatasetStatus.READY
            
            # Store file locally for later access
            file_path = os.path.join(ANALYTICS_STORAGE_DIR, f"{dataset.id}_{file.filename}")
            with open(file_path, 'wb') as f:
                f.write(content)
            dataset.storage_path = file_path
            
            db.commit()
            db.refresh(dataset)
            
        except Exception as e:
            dataset.status = DatasetStatus.ERROR
            dataset.error_message = str(e)
            db.commit()
            raise HTTPException(status_code=500, detail=f"Error processing dataset: {str(e)}")
        
        return dataset
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading dataset: {str(e)}")


@router.get("/datasets", response_model=List[Dataset])
async def list_datasets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all datasets for the current user"""
    datasets = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.user_id == current_user.id
    ).order_by(desc(AnalyticsDataset.created_at)).offset(skip).limit(limit).all()
    
    return datasets


@router.get("/datasets/{dataset_id}", response_model=Dataset)
async def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return dataset


@router.get("/datasets/{dataset_id}/data")
async def get_dataset_data(
    dataset_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dataset data with pagination"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if dataset.status != DatasetStatus.READY:
        raise HTTPException(status_code=400, detail="Dataset is not ready")

    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            return {
                "dataset_id": dataset_id,
                "total_rows": dataset.row_count,
                "columns": [col['name'] for col in dataset.columns_info] if dataset.columns_info else [],
                "data": []
            }

        # Read the stored file
        with open(dataset.storage_path, 'rb') as f:
            content = f.read()

        df = await data_processor.read_file(content, dataset.file_type)

        # Apply pagination
        total_rows = len(df)
        paginated_df = df.iloc[skip : skip + limit]

        # Convert to list of dicts, handling NaN values
        data = paginated_df.replace({np.nan: None}).to_dict(orient="records")

        return {
            "dataset_id": dataset_id,
            "total_rows": total_rows,
            "columns": df.columns.tolist(),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching dataset data: {str(e)}")


@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a dataset and its associated file"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Delete physical file if it exists
    if dataset.storage_path and os.path.exists(dataset.storage_path):
        try:
            os.remove(dataset.storage_path)
        except Exception as e:
            print(f"Error deleting file {dataset.storage_path}: {e}")

    db.delete(dataset)
    db.commit()

    return {"message": "Dataset and associated file deleted successfully"}


# ==================== Statistics & Analysis ====================

@router.get("/datasets/{dataset_id}/statistics", response_model=DatasetStatistics)
async def get_dataset_statistics(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get descriptive statistics for a dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if dataset.status != DatasetStatus.READY:
        raise HTTPException(status_code=400, detail="Dataset is not ready")

    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        # Read the stored file
        with open(dataset.storage_path, 'rb') as f:
            content = f.read()

        df = await data_processor.read_file(content, dataset.file_type)
        stats = data_processor.get_descriptive_statistics(df)
        correlations = data_processor.get_correlation_matrix(df)

        return DatasetStatistics(
            dataset_id=dataset_id,
            summary=stats.get('summary', {}),
            numeric_stats=stats.get('numeric_stats', {}),
            categorical_stats=stats.get('categorical_stats', {}),
            missing_values=stats.get('missing_values', {}),
            correlations=correlations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")


# ==================== Machine Learning ====================

@router.post("/datasets/{dataset_id}/ml/regression", response_model=Analysis)
async def train_regression_model(
    dataset_id: int,
    request: RegressionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Train a regression model on the dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Create analysis record
    analysis = AnalyticsAnalysis(
        dataset_id=dataset_id,
        user_id=current_user.id,
        name=f"Regression: {request.target_column}",
        analysis_type=AnalysisType.REGRESSION,
        parameters=request.dict(),
        status="processing"
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Process ML training
    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        # Read the stored file
        with open(dataset.storage_path, 'rb') as f:
            content = f.read()

        df = await data_processor.read_file(content, dataset.file_type)

        # Train model
        results = await ml_service.train_regression(
            df=df,
            target_column=request.target_column,
            feature_columns=request.feature_columns,
            model_type=request.model_type,
            test_size=request.test_size
        )

        if "error" in results:
            analysis.status = "error"
            analysis.error_message = results["error"]
        else:
            analysis.status = "completed"
            analysis.results = results
            analysis.completed_at = datetime.utcnow()

        db.commit()
    except Exception as e:
        analysis.status = "error"
        analysis.error_message = str(e)
        db.commit()

    return analysis


@router.post("/datasets/{dataset_id}/ml/classification", response_model=Analysis)
async def train_classification_model(
    dataset_id: int,
    request: ClassificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Train a classification model on the dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Create analysis record
    analysis = AnalyticsAnalysis(
        dataset_id=dataset_id,
        user_id=current_user.id,
        name=f"Classification: {request.target_column}",
        analysis_type=AnalysisType.CLASSIFICATION,
        parameters=request.dict(),
        status="processing"
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Process ML training
    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        # Read the stored file
        with open(dataset.storage_path, 'rb') as f:
            content = f.read()

        df = await data_processor.read_file(content, dataset.file_type)

        # Train model
        results = await ml_service.train_classification(
            df=df,
            target_column=request.target_column,
            feature_columns=request.feature_columns,
            model_type=request.model_type,
            test_size=request.test_size
        )

        if "error" in results:
            analysis.status = "error"
            analysis.error_message = results["error"]
        else:
            analysis.status = "completed"
            analysis.results = results
            analysis.completed_at = datetime.utcnow()

        db.commit()
    except Exception as e:
        analysis.status = "error"
        analysis.error_message = str(e)
        db.commit()

    return analysis


@router.post("/datasets/{dataset_id}/ml/clustering", response_model=Analysis)
async def perform_clustering(
    dataset_id: int,
    request: ClusteringRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Perform clustering analysis on the dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Create analysis record
    analysis = AnalyticsAnalysis(
        dataset_id=dataset_id,
        user_id=current_user.id,
        name=f"Clustering: {request.algorithm}",
        analysis_type=AnalysisType.CLUSTERING,
        parameters=request.dict(),
        status="processing"
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Process Clustering
    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        # Read the stored file
        with open(dataset.storage_path, 'rb') as f:
            content = f.read()

        df = await data_processor.read_file(content, dataset.file_type)

        # Perform clustering
        results = await ml_service.perform_clustering(
            df=df,
            feature_columns=request.feature_columns,
            n_clusters=request.n_clusters,
            algorithm=request.algorithm
        )

        if "error" in results:
            analysis.status = "error"
            analysis.error_message = results["error"]
        else:
            analysis.status = "completed"
            analysis.results = results
            analysis.completed_at = datetime.utcnow()

        db.commit()
    except Exception as e:
        analysis.status = "error"
        analysis.error_message = str(e)
        db.commit()

    return analysis


# ==================== Charts ====================

@router.post("/datasets/{dataset_id}/charts", response_model=Chart)
async def create_chart(
    dataset_id: int,
    chart_data: ChartCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new chart for a dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Load dataset and generate chart data
    chart_result = {"data": []}
    try:
        if dataset.storage_path and os.path.exists(dataset.storage_path):
            # Read the stored file
            with open(dataset.storage_path, 'rb') as f:
                content = f.read()

            df = await data_processor.read_file(content, dataset.file_type)

            # Generate chart data using data_processor
            chart_result = data_processor.prepare_chart_data(
                df, chart_data.chart_type.value if hasattr(chart_data.chart_type, 'value') else chart_data.chart_type, chart_data.config
            )
    except Exception as e:
        print(f"Error generating chart data: {e}")
        # Continue with empty data if error occurs
    
    chart = AnalyticsChart(
        dataset_id=dataset_id,
        analysis_id=chart_data.analysis_id,
        user_id=current_user.id,
        name=chart_data.name,
        chart_type=chart_data.chart_type,
        config=chart_data.config,
        data=chart_result
    )
    
    db.add(chart)
    db.commit()
    db.refresh(chart)
    
    return chart


@router.get("/datasets/{dataset_id}/charts", response_model=List[Chart])
async def list_charts(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all charts for a dataset"""
    charts = db.query(AnalyticsChart).filter(
        AnalyticsChart.dataset_id == dataset_id,
        AnalyticsChart.user_id == current_user.id
    ).all()
    
    return charts


@router.get("/charts/{chart_id}", response_model=Chart)
async def get_chart(
    chart_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific chart"""
    chart = db.query(AnalyticsChart).filter(
        AnalyticsChart.id == chart_id,
        AnalyticsChart.user_id == current_user.id
    ).first()
    
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    return chart


@router.put("/charts/{chart_id}", response_model=Chart)
async def update_chart(
    chart_id: int,
    chart_update: ChartUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a chart"""
    chart = db.query(AnalyticsChart).filter(
        AnalyticsChart.id == chart_id,
        AnalyticsChart.user_id == current_user.id
    ).first()
    
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    if chart_update.name:
        chart.name = chart_update.name
    if chart_update.config:
        chart.config = chart_update.config
    if chart_update.data:
        chart.data = chart_update.data
    
    chart.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(chart)
    
    return chart


@router.delete("/charts/{chart_id}")
async def delete_chart(
    chart_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a chart"""
    chart = db.query(AnalyticsChart).filter(
        AnalyticsChart.id == chart_id,
        AnalyticsChart.user_id == current_user.id
    ).first()
    
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    db.delete(chart)
    db.commit()
    
    return {"message": "Chart deleted successfully"}


# ==================== Analyses ====================

@router.get("/datasets/{dataset_id}/analyses", response_model=List[Analysis])
async def list_analyses(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all analyses for a dataset"""
    analyses = db.query(AnalyticsAnalysis).filter(
        AnalyticsAnalysis.dataset_id == dataset_id,
        AnalyticsAnalysis.user_id == current_user.id
    ).order_by(desc(AnalyticsAnalysis.created_at)).all()
    
    return analyses


@router.get("/analyses/{analysis_id}", response_model=Analysis)
async def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific analysis"""
    analysis = db.query(AnalyticsAnalysis).filter(
        AnalyticsAnalysis.id == analysis_id,
        AnalyticsAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis


@router.delete("/analyses/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an analysis"""
    analysis = db.query(AnalyticsAnalysis).filter(
        AnalyticsAnalysis.id == analysis_id,
        AnalyticsAnalysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    db.delete(analysis)
    db.commit()

    return {"message": "Analysis deleted successfully"}


@router.get("/datasets/{dataset_id}/insights")
async def get_dataset_insights(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and return AI insights for a dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.status != DatasetStatus.READY:
        raise HTTPException(status_code=400, detail="Dataset is not ready")

    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            return {"insights": [], "anomalies": []}

        # Read the stored file
        with open(dataset.storage_path, 'rb') as f:
            content = f.read()

        df = await data_processor.read_file(content, dataset.file_type)

        # Generate insights using ML service
        insights = await ml_service.generate_insights(df)

        # Split insights into general insights and anomalies for the frontend
        anomalies = [i for i in insights if i['type'] == 'anomaly']
        general_insights = [i for i in insights if i['type'] != 'anomaly']

        return {
            "insights": general_insights,
            "anomalies": anomalies
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")


@router.post("/ask", response_model=DataAnalysisResponse)
async def ask_data_analysis_agent(
    request: DataAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask natural-language questions about a user-owned analytics dataset."""
    try:
        return await data_analysis_agent_service.analyze(request=request, user_id=current_user.id, db=db)
    except DataAnalysisError as exc:
        raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": exc.safe_message})
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=500,
            detail={"code": "ANALYSIS_FAILED", "message": "Could not complete analysis"},
        )


@router.get("/datasets/{dataset_id}/export")
async def export_dataset(
    dataset_id: int,
    format: ExportFormat = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export dataset in various formats"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        # In a real implementation, we would convert the file if needed.
        # For now, if the format matches or we just return the stored file, we simulate a download URL.
        # Since this is a CLI environment/demo, we'll return a message or the data.

        # Mocking a download URL or returning the data directly
        return {
            "downloadUrl": f"/api/v1/analytics/datasets/{dataset_id}/download?format={format.value}",
            "filename": f"{dataset.name}.{format.value}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting dataset: {str(e)}")


# ==================== SQL Query Execution ====================

@router.post("/datasets/{dataset_id}/query")
async def execute_query(
    dataset_id: int,
    query: str = Query(...),
    query_type: str = Query("sql", pattern="^(sql|nlq)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Execute SQL query or Natural Language Query on dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.status != DatasetStatus.READY:
        raise HTTPException(status_code=400, detail="Dataset is not ready")

    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        # Read the stored file
        with open(dataset.storage_path, 'rb') as f:
            content = f.read()

        df = await data_processor.read_file(content, dataset.file_type)

        # For NLQ, convert to SQL first (simplified - in production use LLM)
        if query_type == "nlq":
            # Simple NLQ to SQL conversion (basic implementation)
            query_lower = query.lower()
            if "show all" in query_lower or "select all" in query_lower:
                sql_query = f"SELECT * FROM dataset LIMIT 100"
            elif "count" in query_lower:
                sql_query = f"SELECT COUNT(*) as count FROM dataset"
            elif "average" in query_lower or "mean" in query_lower:
                # Extract column name (simplified)
                words = query.split()
                col_name = words[-1] if words else "value"
                sql_query = f"SELECT AVG({col_name}) as average FROM dataset"
            else:
                sql_query = query  # Fallback to treating as SQL
        else:
            sql_query = query

        # Execute query using pandasql or direct pandas operations
        try:
            import pandasql as psql
            result_df = psql.sqldf(sql_query, {"dataset": df})
        except ImportError:
            # Fallback: simple query parsing without pandasql
            if "SELECT *" in sql_query.upper():
                limit_match = __import__('re').search(r'LIMIT\s+(\d+)', sql_query, __import__('re').IGNORECASE)
                limit = int(limit_match.group(1)) if limit_match else 100
                result_df = df.head(limit)
            elif "COUNT(*)" in sql_query.upper():
                result_df = pd.DataFrame({"count": [len(df)]})
            else:
                raise HTTPException(status_code=400, detail="SQL execution requires pandasql library. Install with: pip install pandasql")

        # Convert result to JSON
        result_data = result_df.replace({np.nan: None}).to_dict(orient="records")

        return {
            "success": True,
            "query": query,
            "sql_query": sql_query if query_type == "nlq" else query,
            "query_type": query_type,
            "row_count": len(result_data),
            "columns": result_df.columns.tolist(),
            "data": result_data,
            "execution_time_ms": 0  # Would track actual execution time
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query execution error: {str(e)}")


# ==================== Data Cleaning ====================

@router.post("/datasets/{dataset_id}/clean")
async def clean_dataset(
    dataset_id: int,
    operations: List[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apply data cleaning operations to dataset"""
    dataset = db.query(AnalyticsDataset).filter(
        AnalyticsDataset.id == dataset_id,
        AnalyticsDataset.user_id == current_user.id
    ).first()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if dataset.status != DatasetStatus.READY:
        raise HTTPException(status_code=400, detail="Dataset is not ready")

    try:
        if not dataset.storage_path or not os.path.exists(dataset.storage_path):
            raise HTTPException(status_code=404, detail="Dataset file not found")

        # Read the stored file
        with open(dataset.storage_path, 'rb') as f:
            content = f.read()

        df = await data_processor.read_file(content, dataset.file_type)
        original_shape = df.shape
        cleaning_report = []

        # Apply cleaning operations
        for op in operations:
            operation_type = op.get("type")
            column = op.get("column")
            
            if operation_type == "remove_duplicates":
                before = len(df)
                df = df.drop_duplicates()
                removed = before - len(df)
                cleaning_report.append(f"Removed {removed} duplicate rows")
                
            elif operation_type == "fill_missing" and column:
                method = op.get("method", "mean")
                before = df[column].isna().sum()
                if method == "mean":
                    df[column].fillna(df[column].mean(), inplace=True)
                elif method == "median":
                    df[column].fillna(df[column].median(), inplace=True)
                elif method == "mode":
                    df[column].fillna(df[column].mode()[0], inplace=True)
                elif method == "zero":
                    df[column].fillna(0, inplace=True)
                elif method == "forward_fill":
                    df[column].fillna(method='ffill', inplace=True)
                after = df[column].isna().sum()
                filled = before - after
                cleaning_report.append(f"Filled {filled} missing values in {column} using {method}")
                
            elif operation_type == "remove_missing" and column:
                before = len(df)
                df = df.dropna(subset=[column])
                removed = before - len(df)
                cleaning_report.append(f"Removed {removed} rows with missing {column}")
                
            elif operation_type == "remove_outliers" and column:
                Q1 = df[column].quantile(0.25)
                Q3 = df[column].quantile(0.75)
                IQR = Q3 - Q1
                before = len(df)
                df = df[~((df[column] < (Q1 - 1.5 * IQR)) | (df[column] > (Q3 + 1.5 * IQR)))]
                removed = before - len(df)
                cleaning_report.append(f"Removed {removed} outliers from {column}")
                
            elif operation_type == "normalize" and column:
                df[column] = (df[column] - df[column].min()) / (df[column].max() - df[column].min())
                cleaning_report.append(f"Normalized {column} to [0, 1]")
                
            elif operation_type == "standardize" and column:
                df[column] = (df[column] - df[column].mean()) / df[column].std()
                cleaning_report.append(f"Standardized {column} (z-score)")

        # Save cleaned dataset as new version
        cleaned_filename = f"{dataset.id}_cleaned_{file.filename if 'file' in locals() else dataset.file_name}"
        cleaned_path = os.path.join(ANALYTICS_STORAGE_DIR, cleaned_filename)
        
        # Save based on original file type
        if dataset.file_type == 'csv':
            df.to_csv(cleaned_path, index=False)
        elif dataset.file_type in ['xlsx', 'xls']:
            df.to_excel(cleaned_path, index=False)
        elif dataset.file_type == 'json':
            df.to_json(cleaned_path, orient='records')

        return {
            "success": True,
            "original_shape": original_shape,
            "cleaned_shape": df.shape,
            "cleaning_report": cleaning_report,
            "rows_affected": original_shape[0] - df.shape[0],
            "download_url": f"/api/v1/analytics/datasets/{dataset_id}/download/cleaned"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning dataset: {str(e)}")


# ==================== Analysis Sessions ====================

@router.post("/sessions", response_model=AnalysisSessionSchema)
async def create_analysis_session(
    session_in: AnalysisSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new analysis session to save current state"""
    session = AnalyticsSession(
        user_id=current_user.id,
        dataset_id=session_in.dataset_id,
        title=session_in.title,
        description=session_in.description,
        data_summary=session_in.data_summary,
        column_metadata=session_in.column_metadata,
        data_preview=session_in.data_preview,
        charts_data=session_in.charts_data,
        correlation_data=session_in.correlation_data,
        query_history=session_in.query_history,
        ai_insights=session_in.ai_insights,
        custom_charts=session_in.custom_charts,
        file_info=session_in.file_info,
        tags=session_in.tags,
        is_public=session_in.is_public
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[AnalysisSessionSchema])
async def list_analysis_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all saved analysis sessions for the current user"""
    sessions = db.query(AnalyticsSession).filter(
        AnalyticsSession.user_id == current_user.id
    ).order_by(desc(AnalyticsSession.updated_at)).offset(skip).limit(limit).all()
    return sessions


@router.get("/sessions/{session_id}", response_model=AnalysisSessionSchema)
async def get_analysis_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific analysis session"""
    session = db.query(AnalyticsSession).filter(
        AnalyticsSession.id == session_id,
        AnalyticsSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Analysis session not found")

    return session


@router.put("/sessions/{session_id}", response_model=AnalysisSessionSchema)
async def update_analysis_session(
    session_id: int,
    session_update: AnalysisSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing analysis session"""
    session = db.query(AnalyticsSession).filter(
        AnalyticsSession.id == session_id,
        AnalyticsSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Analysis session not found")

    update_data = session_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)

    session.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(session)
    return session


@router.delete("/sessions/{session_id}")
async def delete_analysis_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an analysis session"""
    session = db.query(AnalyticsSession).filter(
        AnalyticsSession.id == session_id,
        AnalyticsSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Analysis session not found")

    db.delete(session)
    db.commit()
    return {"message": "Analysis session deleted successfully"}
