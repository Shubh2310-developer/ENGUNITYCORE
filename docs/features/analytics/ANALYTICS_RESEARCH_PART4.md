# Analytics Dashboard - API & Frontend Implementation (Part 4)

**Date:** January 18, 2026  
**Continuation of:** ANALYTICS_RESEARCH_PART3.md

---

## 🔌 Complete API Endpoints Implementation

### Full Analytics Router

```python
# backend/app/api/v1/analytics_complete.py

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
import pandas as pd
import io

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.core.mongodb import mongodb
from app.models.user import User
from app.models.analytics import (
    AnalyticsDataset, AnalyticsAnalysis, AnalyticsChart,
    AnalyticsDashboard, AnalyticsDashboardWidget
)
from app.schemas.analytics import (
    Dataset, DatasetCreate, DatasetWithData,
    Analysis, AnalysisCreate,
    Chart, ChartCreate,
    DatasetStatistics
)
from app.services.analytics.data_processor import data_processor
from app.services.analytics.ml_service import ml_service
from app.services.storage.supabase import storage_service

router = APIRouter()

# ==================== Dataset Management ====================

@router.post("/datasets/upload", response_model=Dataset)
async def upload_dataset(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    name: Optional[str] = None,
    description: Optional[str] = None,
    background_tasks: BackgroundTasks
) -> Any:
    """
    Upload a dataset file (CSV, Excel, JSON).
    Processes file and stores in Supabase + MongoDB.
    """
    # Validate file type
    allowed_extensions = {'.csv', '.xlsx', '.xls', '.json'}
    file_ext = '.' + file.filename.split('.')[-1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Read file content
    content = await file.read()
    file_size = len(content)
    
    # Process based on file type
    try:
        if file_ext == '.csv':
            metadata = await data_processor.process_csv(content, file.filename)
        elif file_ext in ['.xlsx', '.xls']:
            metadata = await data_processor.process_excel(content, file.filename)
        elif file_ext == '.json':
            metadata = await data_processor.process_json(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")
    
    # Create dataset record
    dataset_name = name or file.filename
    dataset = AnalyticsDataset(
        user_id=current_user.id,
        name=dataset_name,
        description=description,
        source_type=file_ext[1:],  # Remove dot
        row_count=metadata['row_count'],
        column_count=metadata['column_count'],
        file_size=file_size,
        status='processing',
        metadata={'columns': metadata['columns']}
    )
    
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    # Upload file to Supabase Storage
    try:
        storage_path = f"{current_user.id}/analytics/{dataset.id}/{file.filename}"
        await storage_service.upload_file(
            bucket="analytics",
            path=storage_path,
            file_content=content,
            content_type=file.content_type
        )
        dataset.file_path = storage_path
    except Exception as e:
        dataset.status = 'error'
        dataset.error_message = f"Storage upload failed: {str(e)}"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
    
    # Store data in MongoDB (chunked for large datasets)
    try:
        if mongodb.db is not None:
            # Store in chunks of 10,000 rows
            chunk_size = 10000
            for i in range(0, len(metadata['data']), chunk_size):
                chunk_data = metadata['data'][i:i + chunk_size]
                await mongodb.db.dataset_data.insert_one({
                    "dataset_id": str(dataset.id),
                    "user_id": current_user.id,
                    "data": chunk_data,
                    "chunk_index": i // chunk_size
                })
        
        dataset.status = 'ready'
    except Exception as e:
        dataset.status = 'error'
        dataset.error_message = f"Data storage failed: {str(e)}"
    
    db.commit()
    db.refresh(dataset)
    
    return dataset

@router.get("/datasets", response_model=List[Dataset])
async def get_datasets(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """Get all datasets for current user"""
    datasets = db.query(AnalyticsDataset)\
        .filter(AnalyticsDataset.user_id == current_user.id)\
        .offset(skip)\
        .limit(limit)\
        .all()
    return datasets

@router.get("/datasets/{dataset_id}", response_model=Dataset)
async def get_dataset(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    dataset_id: UUID
) -> Any:
    """Get dataset details"""
    dataset = db.query(AnalyticsDataset)\
        .filter(
            AnalyticsDataset.id == dataset_id,
            AnalyticsDataset.user_id == current_user.id
        )\
        .first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return dataset

@router.get("/datasets/{dataset_id}/data")
async def get_dataset_data(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    dataset_id: UUID,
    page: int = 1,
    limit: int = 100
) -> Any:
    """Get paginated dataset data"""
    dataset = db.query(AnalyticsDataset)\
        .filter(
            AnalyticsDataset.id == dataset_id,
            AnalyticsDataset.user_id == current_user.id
        )\
        .first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Fetch data from MongoDB
    if mongodb.db is None:
        raise HTTPException(status_code=503, detail="MongoDB not available")
    
    skip = (page - 1) * limit
    
    # Get data chunks
    chunks = await mongodb.db.dataset_data.find({
        "dataset_id": str(dataset_id)
    }).to_list(length=None)
    
    # Flatten all chunks
    all_data = []
    for chunk in chunks:
        all_data.extend(chunk.get('data', []))
    
    # Paginate
    paginated_data = all_data[skip:skip + limit]
    total_rows = len(all_data)
    total_pages = (total_rows + limit - 1) // limit
    
    return {
        "data": paginated_data,
        "page": page,
        "limit": limit,
        "total_rows": total_rows,
        "total_pages": total_pages,
        "columns": dataset.metadata.get('columns', []) if dataset.metadata else []
    }

@router.delete("/datasets/{dataset_id}")
async def delete_dataset(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    dataset_id: UUID
) -> Any:
    """Delete dataset and associated data"""
    dataset = db.query(AnalyticsDataset)\
        .filter(
            AnalyticsDataset.id == dataset_id,
            AnalyticsDataset.user_id == current_user.id
        )\
        .first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Delete from Supabase Storage
    if dataset.file_path:
        try:
            await storage_service.delete_file("analytics", dataset.file_path)
        except:
            pass
    
    # Delete from MongoDB
    if mongodb.db is not None:
        await mongodb.db.dataset_data.delete_many({"dataset_id": str(dataset_id)})
    
    # Delete from PostgreSQL (cascades to related records)
    db.delete(dataset)
    db.commit()
    
    return {"message": "Dataset deleted successfully"}

# ==================== Statistics & Analysis ====================

@router.get("/datasets/{dataset_id}/statistics", response_model=DatasetStatistics)
async def get_dataset_statistics(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    dataset_id: UUID
) -> Any:
    """Compute summary statistics for dataset"""
    dataset = db.query(AnalyticsDataset)\
        .filter(
            AnalyticsDataset.id == dataset_id,
            AnalyticsDataset.user_id == current_user.id
        )\
        .first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Fetch data from MongoDB
    if mongodb.db is None:
        raise HTTPException(status_code=503, detail="MongoDB not available")
    
    chunks = await mongodb.db.dataset_data.find({
        "dataset_id": str(dataset_id)
    }).to_list(length=None)
    
    # Combine chunks
    all_data = []
    for chunk in chunks:
        all_data.extend(chunk.get('data', []))
    
    # Convert to DataFrame
    df = pd.DataFrame(all_data)
    
    # Compute statistics
    stats = await data_processor.compute_statistics(df)
    
    return stats

@router.post("/datasets/{dataset_id}/correlate")
async def compute_correlation(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    dataset_id: UUID,
    method: str = 'pearson',
    columns: Optional[List[str]] = None
) -> Any:
    """Compute correlation matrix"""
    dataset = db.query(AnalyticsDataset)\
        .filter(
            AnalyticsDataset.id == dataset_id,
            AnalyticsDataset.user_id == current_user.id
        )\
        .first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Fetch data
    if mongodb.db is None:
        raise HTTPException(status_code=503, detail="MongoDB not available")
    
    chunks = await mongodb.db.dataset_data.find({
        "dataset_id": str(dataset_id)
    }).to_list(length=None)
    
    all_data = []
    for chunk in chunks:
        all_data.extend(chunk.get('data', []))
    
    df = pd.DataFrame(all_data)
    
    # Compute correlation
    try:
        correlation = await data_processor.compute_correlation(df, method, columns)
        return correlation
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==================== Machine Learning ====================

@router.post("/datasets/{dataset_id}/ml/train", response_model=Analysis)
async def train_ml_model(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    dataset_id: UUID,
    request: AnalysisCreate,
    background_tasks: BackgroundTasks
) -> Any:
    """Train a machine learning model"""
    dataset = db.query(AnalyticsDataset)\
        .filter(
            AnalyticsDataset.id == dataset_id,
            AnalyticsDataset.user_id == current_user.id
        )\
        .first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Create analysis record
    analysis = AnalyticsAnalysis(
        dataset_id=dataset_id,
        user_id=current_user.id,
        name=request.name,
        analysis_type='ml',
        configuration=request.configuration,
        status='training'
    )
    
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # Train model in background
    async def train_model_task():
        try:
            # Fetch data
            chunks = await mongodb.db.dataset_data.find({
                "dataset_id": str(dataset_id)
            }).to_list(length=None)
            
            all_data = []
            for chunk in chunks:
                all_data.extend(chunk.get('data', []))
            
            df = pd.DataFrame(all_data)
            
            # Train model
            config = request.configuration
            results = await ml_service.train_model(
                df=df,
                model_type=config.get('model_type', 'regression'),
                algorithm=config.get('algorithm', 'linear_regression'),
                target_column=config['target_column'],
                feature_columns=config['feature_columns'],
                parameters=config.get('parameters', {}),
                test_size=config.get('test_size', 0.2)
            )
            
            # Update analysis
            analysis.results = results
            analysis.status = 'completed'
            analysis.execution_time = results['execution_time']
            from datetime import datetime
            analysis.completed_at = datetime.utcnow()
            
            db.commit()
            
        except Exception as e:
            analysis.status = 'error'
            analysis.results = {'error': str(e)}
            db.commit()
    
    background_tasks.add_task(train_model_task)
    
    return analysis

@router.get("/analyses/{analysis_id}", response_model=Analysis)
async def get_analysis(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    analysis_id: UUID
) -> Any:
    """Get analysis results"""
    analysis = db.query(AnalyticsAnalysis)\
        .filter(
            AnalyticsAnalysis.id == analysis_id,
            AnalyticsAnalysis.user_id == current_user.id
        )\
        .first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return analysis

# ==================== Charts ====================

@router.post("/charts", response_model=Chart)
async def create_chart(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    chart_in: ChartCreate
) -> Any:
    """Create a new chart"""
    # Verify dataset ownership
    dataset = db.query(AnalyticsDataset)\
        .filter(
            AnalyticsDataset.id == chart_in.dataset_id,
            AnalyticsDataset.user_id == current_user.id
        )\
        .first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    chart = AnalyticsChart(
        **chart_in.model_dump(),
        user_id=current_user.id
    )
    
    db.add(chart)
    db.commit()
    db.refresh(chart)
    
    return chart

@router.get("/charts/{chart_id}/data")
async def get_chart_data(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    chart_id: UUID
) -> Any:
    """Get data for rendering a chart"""
    chart = db.query(AnalyticsChart)\
        .filter(
            AnalyticsChart.id == chart_id,
            AnalyticsChart.user_id == current_user.id
        )\
        .first()
    
    if not chart:
        raise HTTPException(status_code=404, detail="Chart not found")
    
    # Fetch dataset data
    if mongodb.db is None:
        raise HTTPException(status_code=503, detail="MongoDB not available")
    
    chunks = await mongodb.db.dataset_data.find({
        "dataset_id": str(chart.dataset_id)
    }).to_list(length=None)
    
    all_data = []
    for chunk in chunks:
        all_data.extend(chunk.get('data', []))
    
    df = pd.DataFrame(all_data)
    
    # Extract chart configuration
    config = chart.configuration
    x_axis = config.get('x_axis')
    y_axis = config.get('y_axis', [])
    
    # Prepare chart data
    chart_data = {
        "labels": df[x_axis].tolist() if x_axis else [],
        "datasets": []
    }
    
    for y_col in y_axis:
        if y_col in df.columns:
            chart_data["datasets"].append({
                "label": y_col,
                "data": df[y_col].tolist()
            })
    
    return chart_data

# ==================== Export ====================

@router.get("/datasets/{dataset_id}/export/csv")
async def export_to_csv(
    *,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    dataset_id: UUID
) -> Any:
    """Export dataset to CSV"""
    from fastapi.responses import StreamingResponse
    
    dataset = db.query(AnalyticsDataset)\
        .filter(
            AnalyticsDataset.id == dataset_id,
            AnalyticsDataset.user_id == current_user.id
        )\
        .first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Fetch data
    if mongodb.db is None:
        raise HTTPException(status_code=503, detail="MongoDB not available")
    
    chunks = await mongodb.db.dataset_data.find({
        "dataset_id": str(dataset_id)
    }).to_list(length=None)
    
    all_data = []
    for chunk in chunks:
        all_data.extend(chunk.get('data', []))
    
    df = pd.DataFrame(all_data)
    
    # Convert to CSV
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)
    
    return StreamingResponse(
        iter([stream.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={dataset.name}.csv"}
    )
```

---

**Continue to Part 5 for Frontend Implementation...**
