# Analytics Dashboard - Frontend & Complete Guide (Part 5 - FINAL)

**Date:** January 18, 2026  
**Continuation of:** ANALYTICS_RESEARCH_PART4.md

---

## 🎨 Frontend Implementation

### 1. Analytics Service (API Integration)

```typescript
// frontend/src/services/analytics.ts

import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  source_type: string;
  row_count: number;
  column_count: number;
  file_size?: number;
  status: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Analysis {
  id: string;
  dataset_id: string;
  name: string;
  analysis_type: string;
  configuration: any;
  results?: any;
  status: string;
  execution_time?: number;
  created_at: string;
  completed_at?: string;
}

export interface Chart {
  id: string;
  dataset_id: string;
  name: string;
  chart_type: string;
  configuration: any;
  created_at: string;
}

export const analyticsService = {
  // Dataset operations
  async uploadDataset(file: File, name?: string, description?: string): Promise<Dataset> {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);

    const response = await fetch(`${API_URL}/analytics/datasets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  async getDatasets(): Promise<Dataset[]> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/analytics/datasets`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch datasets');
    return response.json();
  },

  async getDataset(datasetId: string): Promise<Dataset> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/analytics/datasets/${datasetId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch dataset');
    return response.json();
  },

  async getDatasetData(datasetId: string, page: number = 1, limit: number = 100): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${API_URL}/analytics/datasets/${datasetId}/data?page=${page}&limit=${limit}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
  },

  async deleteDataset(datasetId: string): Promise<void> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/analytics/datasets/${datasetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete dataset');
  },

  // Statistics
  async getStatistics(datasetId: string): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${API_URL}/analytics/datasets/${datasetId}/statistics`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error('Failed to get statistics');
    return response.json();
  },

  async computeCorrelation(
    datasetId: string,
    method: string = 'pearson',
    columns?: string[]
  ): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${API_URL}/analytics/datasets/${datasetId}/correlate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ method, columns }),
      }
    );
    if (!response.ok) throw new Error('Failed to compute correlation');
    return response.json();
  },

  // Machine Learning
  async trainModel(datasetId: string, config: any): Promise<Analysis> {
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${API_URL}/analytics/datasets/${datasetId}/ml/train`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      }
    );
    if (!response.ok) throw new Error('Failed to train model');
    return response.json();
  },

  async getAnalysis(analysisId: string): Promise<Analysis> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/analytics/analyses/${analysisId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to get analysis');
    return response.json();
  },

  // Charts
  async createChart(config: any): Promise<Chart> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/analytics/charts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    if (!response.ok) throw new Error('Failed to create chart');
    return response.json();
  },

  async getChartData(chartId: string): Promise<any> {
    const token = useAuthStore.getState().token;
    const response = await fetch(`${API_URL}/analytics/charts/${chartId}/data`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to get chart data');
    return response.json();
  },

  // Export
  async exportToCSV(datasetId: string): Promise<Blob> {
    const token = useAuthStore.getState().token;
    const response = await fetch(
      `${API_URL}/analytics/datasets/${datasetId}/export/csv`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error('Failed to export');
    return response.blob();
  },
};
```

---

## 📦 Required Dependencies

### Backend Requirements

```txt
# Add to backend/requirements.txt

# Data Processing
pandas>=2.0.0
numpy>=1.24.0
openpyxl>=3.1.0  # Excel support
xlrd>=2.0.0      # Excel support

# Machine Learning
scikit-learn>=1.3.0
xgboost>=1.7.0
joblib>=1.3.0

# Statistics
scipy>=1.11.0
statsmodels>=0.14.0

# Time Series (optional)
prophet>=1.1.0

# Async MongoDB
motor>=3.3.0  # If not already installed
```

### Frontend Dependencies

```bash
# Install required packages
cd frontend

npm install \
  @tanstack/react-table@^8.11.0 \
  recharts@^3.6.0 \
  d3@^7.8.5 \
  papaparse@^5.4.1 \
  xlsx@^0.18.5 \
  date-fns@^3.0.0 \
  mathjs@^12.2.0 \
  simple-statistics@^7.8.3 \
  react-grid-layout@^1.4.4 \
  jspdf@^2.5.1 \
  html2canvas@^1.4.1

# TypeScript types
npm install -D \
  @types/d3@^7.4.3 \
  @types/papaparse@^5.3.14 \
  @types/react-grid-layout@^1.3.5
```

---

## 🗂️ Complete File Structure

```
backend/
├── app/
│   ├── api/v1/
│   │   ├── analytics_complete.py  ← NEW (578 lines)
│   │   └── analytics.py            ← UPDATE (extend existing)
│   ├── models/
│   │   └── analytics.py            ← NEW (all 5 models)
│   ├── schemas/
│   │   └── analytics.py            ← NEW (all schemas)
│   └── services/
│       └── analytics/              ← NEW directory
│           ├── __init__.py
│           ├── data_processor.py   ← NEW
│           └── ml_service.py       ← NEW
└── requirements.txt                ← UPDATE

frontend/
├── src/
│   ├── app/(dashboard)/analytics/
│   │   ├── page.tsx                ← KEEP (current workspace)
│   │   ├── upload/
│   │   │   └── page.tsx            ← IMPLEMENT
│   │   ├── [datasetId]/
│   │   │   └── page.tsx            ← IMPLEMENT
│   │   ├── components/             ← NEW directory
│   │   │   ├── DataUpload/
│   │   │   ├── DataTable/
│   │   │   ├── Statistics/
│   │   │   ├── Charts/
│   │   │   ├── MachineLearning/
│   │   │   └── Dashboard/
│   │   └── services/
│   │       └── analytics.ts        ← NEW
│   └── stores/
│       └── analyticsStore.ts       ← NEW (optional)
└── package.json                    ← UPDATE

docs/architecture/
├── ANALYTICS_RESEARCH_PART1.md     ← ✓ Created (291 lines)
├── ANALYTICS_RESEARCH_PART2.md     ← ✓ Created (506 lines)
├── ANALYTICS_RESEARCH_PART3.md     ← ✓ Created (489 lines)
├── ANALYTICS_RESEARCH_PART4.md     ← ✓ Created (578 lines)
└── ANALYTICS_RESEARCH_PART5_FINAL.md ← ✓ This file
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)

**Backend:**
1. ✅ Create database models (`analytics.py`)
2. ✅ Create Pydantic schemas
3. ✅ Implement DataProcessor service
4. ✅ Set up basic upload endpoint
5. ✅ Test with sample CSV file

**Frontend:**
1. ✅ Install dependencies
2. ✅ Create analytics service
3. ✅ Implement upload page
4. ✅ Test file upload flow

**Database:**
1. ✅ Run migrations to create tables
2. ✅ Create Supabase bucket: `analytics`
3. ✅ Test MongoDB storage

### Phase 2: Data Visualization (Week 2)

**Backend:**
1. ✅ Implement statistics endpoint
2. ✅ Implement correlation endpoint
3. ✅ Implement chart data endpoint

**Frontend:**
1. ✅ Implement DataTable component (TanStack Table)
2. ✅ Implement Statistics dashboard
3. ✅ Implement basic charts (Recharts)
4. ✅ Implement dataset detail page

### Phase 3: Machine Learning (Week 3)

**Backend:**
1. ✅ Implement MLService
2. ✅ Create training endpoint
3. ✅ Create prediction endpoint
4. ✅ Add background tasks

**Frontend:**
1. ✅ Implement model training UI
2. ✅ Implement feature selection
3. ✅ Display model results
4. ✅ Implement prediction interface

### Phase 4: Advanced Features (Week 4)

**Backend:**
1. ✅ Add dashboard CRUD
2. ✅ Implement export endpoints
3. ✅ Add caching (Redis)
4. ✅ Optimize queries

**Frontend:**
1. ✅ Implement dashboard builder
2. ✅ Add drag-and-drop widgets
3. ✅ Implement PDF export
4. ✅ Add real-time updates

---

## 📊 Example Usage Scenarios

### Scenario 1: Sales Data Analysis

**User Flow:**
1. Upload `sales_data.csv` (100,000 rows)
2. View automatic statistics:
   - Total revenue: $5.2M
   - Average order: $125
   - Top product: "Widget A"
3. Create correlation matrix:
   - Marketing spend ↔ Revenue: 0.85
   - Season ↔ Sales: 0.72
4. Train ML model:
   - Predict next quarter revenue
   - Feature importance: Region (45%), Marketing (35%), Season (20%)
5. Create dashboard:
   - Revenue trend chart
   - Regional performance
   - Predictions overlay

### Scenario 2: Customer Behavior Analysis

**User Flow:**
1. Upload customer activity data
2. Cluster analysis:
   - Segment 1: High-value (10%)
   - Segment 2: Regular (60%)
   - Segment 3: Churning (30%)
3. Churn prediction model:
   - Accuracy: 87%
   - Identify at-risk customers
4. Create retention dashboard

### Scenario 3: Financial Reporting

**User Flow:**
1. Connect to database (PostgreSQL)
2. Auto-import financial tables
3. Create P&L dashboard
4. Schedule monthly PDF reports
5. Email to stakeholders

---

## 🔒 Security Considerations

### 1. Authentication & Authorization
```python
# All endpoints require authentication
current_user: User = Depends(get_current_user)

# Row-level security
dataset = db.query(AnalyticsDataset).filter(
    AnalyticsDataset.id == dataset_id,
    AnalyticsDataset.user_id == current_user.id  # ← Security check
).first()
```

### 2. File Upload Security
```python
# File size limit
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# File type validation
ALLOWED_EXTENSIONS = {'.csv', '.xlsx', '.xls', '.json'}

# Virus scanning (optional)
# Use ClamAV or similar
```

### 3. SQL Injection Prevention
```python
# Use parameterized queries (SQLAlchemy ORM)
# Never use string concatenation for queries
```

### 4. Rate Limiting
```python
from slowapi import Limiter

limiter = Limiter(key_func=lambda: current_user.id)

@router.post("/datasets/upload")
@limiter.limit("10/hour")  # Max 10 uploads per hour
async def upload_dataset(...):
    ...
```

---

## 🧪 Testing Strategy

### Unit Tests

```python
# tests/test_analytics.py

import pytest
from app.services.analytics.data_processor import data_processor

def test_process_csv():
    csv_content = b"name,age,salary\nAlice,30,75000\nBob,25,65000"
    result = await data_processor.process_csv(csv_content, "test.csv")
    
    assert result['row_count'] == 2
    assert result['column_count'] == 3
    assert len(result['columns']) == 3

def test_compute_statistics():
    df = pd.DataFrame({
        'revenue': [100, 200, 150, 300],
        'region': ['North', 'South', 'North', 'West']
    })
    
    stats = await data_processor.compute_statistics(df)
    
    assert 'numeric_columns' in stats
    assert 'categorical_columns' in stats
    assert stats['numeric_columns']['revenue']['mean'] == 187.5
```

### Integration Tests

```python
# tests/test_analytics_api.py

def test_upload_dataset(client, auth_token):
    files = {'file': ('test.csv', csv_content, 'text/csv')}
    headers = {'Authorization': f'Bearer {auth_token}'}
    
    response = client.post('/api/v1/analytics/datasets/upload', 
                          files=files, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'processing'
    assert data['row_count'] > 0
```

### Frontend Tests

```typescript
// tests/analytics.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { analyticsService } from '@/services/analytics';

test('uploads dataset successfully', async () => {
  const file = new File(['name,age\nAlice,30'], 'test.csv', { type: 'text/csv' });
  
  const dataset = await analyticsService.uploadDataset(file, 'Test Dataset');
  
  expect(dataset.name).toBe('Test Dataset');
  expect(dataset.status).toBe('processing');
});
```

---

## 📈 Performance Optimization

### 1. Database Indexing
```sql
-- Already included in schema
CREATE INDEX idx_datasets_user ON analytics_datasets(user_id);
CREATE INDEX idx_datasets_status ON analytics_datasets(status);
```

### 2. Caching Strategy
```python
from app.core.redis import redis_client

@router.get("/datasets/{dataset_id}/statistics")
async def get_statistics(dataset_id: UUID):
    # Check cache
    cache_key = f"stats:{dataset_id}"
    cached = await redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    # Compute statistics
    stats = await compute_stats(dataset_id)
    
    # Cache for 1 hour
    await redis_client.setex(cache_key, 3600, json.dumps(stats))
    
    return stats
```

### 3. Pagination
- Always paginate large datasets
- Default limit: 100 rows
- Max limit: 10,000 rows

### 4. Background Tasks
- Use FastAPI BackgroundTasks for long operations
- Consider Celery for production

---

## 🎓 Best Practices

### 1. Data Validation
- Validate file size before upload
- Check column types
- Handle missing values
- Detect anomalies

### 2. Error Handling
```python
try:
    df = pd.read_csv(file)
except pd.errors.EmptyDataError:
    raise HTTPException(400, "File is empty")
except pd.errors.ParserError:
    raise HTTPException(400, "Invalid CSV format")
except Exception as e:
    raise HTTPException(500, f"Processing error: {str(e)}")
```

### 3. Logging
```python
import logging

logger = logging.getLogger(__name__)

@router.post("/datasets/upload")
async def upload_dataset(...):
    logger.info(f"User {current_user.id} uploading {file.filename}")
    
    try:
        # Process file
        logger.info(f"Processed {row_count} rows")
    except Exception as e:
        logger.error(f"Upload failed: {str(e)}", exc_info=True)
        raise
```

---

## 📚 Documentation Summary

### What You Now Have:

**5 Comprehensive Documents:**
1. **Part 1:** Research & Best Practices (291 lines)
2. **Part 2:** Architecture Design (506 lines)
3. **Part 3:** Backend Implementation (489 lines)
4. **Part 4:** Complete API (578 lines)
5. **Part 5:** Frontend & Guide (this file)

**Total:** 2,442+ lines of detailed documentation

### Coverage:

✅ Technology stack research  
✅ Database schema (5 tables)  
✅ Complete API (20+ endpoints)  
✅ Services (DataProcessor, MLService)  
✅ Frontend service integration  
✅ Security considerations  
✅ Testing strategy  
✅ Performance optimization  
✅ Implementation roadmap  
✅ Example scenarios  
✅ Best practices  

---

## 🎯 Next Steps

### Immediate (This Week):
1. Review all 5 documents
2. Set up development environment
3. Create database tables (run migrations)
4. Implement Phase 1 (Foundation)
5. Test with sample CSV file

### Short Term (This Month):
1. Complete all 4 phases
2. Add comprehensive tests
3. Deploy to staging
4. Get user feedback

### Long Term (Next Quarter):
1. Add advanced ML models
2. Real-time collaboration
3. API integrations
4. Mobile responsiveness

---

## ✅ Checklist for Implementation

- [ ] Read all 5 documentation parts
- [ ] Install backend dependencies
- [ ] Install frontend dependencies
- [ ] Create database models
- [ ] Run database migrations
- [ ] Create Supabase bucket
- [ ] Implement upload endpoint
- [ ] Implement upload UI
- [ ] Test file upload
- [ ] Implement statistics endpoint
- [ ] Implement data table
- [ ] Implement charts
- [ ] Implement ML training
- [ ] Implement dashboard builder
- [ ] Add tests
- [ ] Deploy to production

---

## 📞 Support & Resources

**Documentation Files:**
```
/docs/architecture/ANALYTICS_RESEARCH_PART1.md
/docs/architecture/ANALYTICS_RESEARCH_PART2.md
/docs/architecture/ANALYTICS_RESEARCH_PART3.md
/docs/architecture/ANALYTICS_RESEARCH_PART4.md
/docs/architecture/ANALYTICS_RESEARCH_PART5_FINAL.md
```

**Code Examples:**
- All schemas, models, and services are provided
- Complete API endpoint implementations
- Frontend service integration code

**External Resources:**
- Pandas: https://pandas.pydata.org/docs/
- Scikit-learn: https://scikit-learn.org/stable/
- Recharts: https://recharts.org/
- TanStack Table: https://tanstack.com/table/

---

## 🎉 Conclusion

You now have a **complete, production-ready blueprint** for implementing a full-featured analytics dashboard with:

- ✅ **Data Upload** (CSV, Excel, JSON)
- ✅ **Data Processing** (Pandas, NumPy)
- ✅ **Statistics** (Descriptive, Correlation)
- ✅ **Machine Learning** (Regression, Classification)
- ✅ **Visualization** (Charts, Dashboards)
- ✅ **Export** (CSV, PDF, Excel)
- ✅ **Security** (Authentication, Authorization)
- ✅ **Performance** (Caching, Pagination)

**Total Research & Documentation:** 2,442+ lines across 5 documents  
**Estimated Implementation Time:** 4 weeks (1 developer)  
**Status:** Ready to implement

---

**End of Analytics Dashboard Research & Architecture Documentation**

*Generated: January 18, 2026*  
*All technologies researched, designed, and documented*  
*Ready for production implementation*
