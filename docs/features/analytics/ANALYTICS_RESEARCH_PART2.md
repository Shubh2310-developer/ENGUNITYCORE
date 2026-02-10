# Analytics Dashboard - Architecture Design (Part 2)

**Date:** January 18, 2026  
**Continuation of:** ANALYTICS_RESEARCH_PART1.md

---

## 🏛️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Upload     │  │  Dashboard   │  │   Charts     │         │
│  │   Component  │  │  Component   │  │   Component  │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│         └─────────────────┼──────────────────┘                  │
│                           │                                     │
│                    ┌──────▼───────┐                            │
│                    │  API Service │                            │
│                    └──────┬───────┘                            │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP/REST
┌───────────────────────────▼─────────────────────────────────────┐
│                      BACKEND (FastAPI)                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API ENDPOINTS                             ││
│  │  /upload  /datasets  /analyze  /ml  /export                 ││
│  └──────────────────────┬───────────────────────────────────────┘│
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────────┐│
│  │                SERVICE LAYER                                 ││
│  │  • DataProcessor  • StatisticsService  • MLService          ││
│  │  • VisualizationService  • ExportService                    ││
│  └──────────────────────┬───────────────────────────────────────┘│
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────────┐│
│  │                DATA LAYER                                    ││
│  │  • PostgreSQL (metadata)  • MongoDB (raw data)              ││
│  │  • Redis (cache)  • Supabase (file storage)                ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema Design

### PostgreSQL Tables

#### 1. `analytics_datasets` Table
```sql
CREATE TABLE analytics_datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(50), -- 'csv', 'excel', 'json', 'api', 'database'
    file_path TEXT, -- Supabase storage path
    row_count INTEGER,
    column_count INTEGER,
    file_size BIGINT, -- in bytes
    status VARCHAR(50) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'ready', 'error'
    error_message TEXT,
    metadata JSONB, -- column types, summary stats, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_datasets_user ON analytics_datasets(user_id);
CREATE INDEX idx_datasets_status ON analytics_datasets(status);
```

#### 2. `analytics_analyses` Table
```sql
CREATE TABLE analytics_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES analytics_datasets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(50), -- 'statistical', 'ml', 'visualization', 'correlation'
    configuration JSONB, -- analysis parameters
    results JSONB, -- analysis results
    status VARCHAR(50) DEFAULT 'pending',
    execution_time FLOAT, -- in seconds
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_analyses_dataset ON analytics_analyses(dataset_id);
CREATE INDEX idx_analyses_user ON analytics_analyses(user_id);
```

#### 3. `analytics_charts` Table
```sql
CREATE TABLE analytics_charts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES analytics_datasets(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES analytics_analyses(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    chart_type VARCHAR(50), -- 'line', 'bar', 'pie', 'scatter', 'heatmap', etc.
    configuration JSONB, -- x_axis, y_axis, colors, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_charts_dataset ON analytics_charts(dataset_id);
```

#### 4. `analytics_dashboards` Table
```sql
CREATE TABLE analytics_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    layout JSONB, -- grid layout configuration
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dashboards_user ON analytics_dashboards(user_id);
```

#### 5. `analytics_dashboard_widgets` Table
```sql
CREATE TABLE analytics_dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dashboard_id UUID REFERENCES analytics_dashboards(id) ON DELETE CASCADE,
    widget_type VARCHAR(50), -- 'chart', 'metric', 'table', 'text'
    chart_id UUID REFERENCES analytics_charts(id) ON DELETE SET NULL,
    dataset_id UUID REFERENCES analytics_datasets(id) ON DELETE SET NULL,
    configuration JSONB,
    position JSONB, -- {x, y, w, h}
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_widgets_dashboard ON analytics_dashboard_widgets(dashboard_id);
```

### MongoDB Collections

#### 1. `dataset_data` Collection
```javascript
{
  _id: ObjectId,
  dataset_id: "uuid",
  user_id: 123,
  data: [
    { col1: value1, col2: value2, ... }, // Row 1
    { col1: value1, col2: value2, ... }, // Row 2
    // ... up to 10,000 rows per document
  ],
  chunk_index: 0, // For pagination
  created_at: ISODate
}
```

#### 2. `analysis_cache` Collection
```javascript
{
  _id: ObjectId,
  cache_key: "dataset_uuid:analysis_type:params_hash",
  dataset_id: "uuid",
  analysis_type: "correlation",
  parameters: {},
  results: {},
  expires_at: ISODate,
  created_at: ISODate
}
```

---

## 🔌 API Endpoints Design

### 1. Dataset Management

```python
# Upload dataset
POST /api/v1/analytics/datasets/upload
Content-Type: multipart/form-data
Body: {
  file: <file>,
  name: "Sales Data Q4",
  description: "Quarterly sales data"
}
Response: {
  id: "uuid",
  name: "Sales Data Q4",
  status: "processing",
  row_count: 0,
  column_count: 0
}

# Get all datasets
GET /api/v1/analytics/datasets
Response: [
  {
    id: "uuid",
    name: "Sales Data Q4",
    row_count: 5000,
    column_count: 12,
    status: "ready",
    created_at: "2026-01-18T10:00:00Z"
  }
]

# Get dataset details
GET /api/v1/analytics/datasets/{dataset_id}
Response: {
  id: "uuid",
  name: "Sales Data Q4",
  columns: [
    {name: "date", type: "datetime", nullable: false},
    {name: "revenue", type: "float", nullable: false},
    {name: "region", type: "string", nullable: true}
  ],
  summary: {
    row_count: 5000,
    numeric_columns: 8,
    categorical_columns: 4
  }
}

# Get dataset data (paginated)
GET /api/v1/analytics/datasets/{dataset_id}/data?page=1&limit=100
Response: {
  data: [...], // Array of rows
  page: 1,
  total_pages: 50,
  total_rows: 5000
}

# Delete dataset
DELETE /api/v1/analytics/datasets/{dataset_id}
```

### 2. Data Analysis

```python
# Get summary statistics
GET /api/v1/analytics/datasets/{dataset_id}/statistics
Response: {
  numeric_columns: {
    "revenue": {
      mean: 15000.50,
      median: 14000.00,
      std: 5000.25,
      min: 1000.00,
      max: 50000.00,
      quartiles: [10000, 14000, 20000]
    }
  },
  categorical_columns: {
    "region": {
      unique_count: 5,
      top_values: [
        {"value": "North", "count": 1200},
        {"value": "South", "count": 1000}
      ]
    }
  }
}

# Correlation analysis
POST /api/v1/analytics/datasets/{dataset_id}/correlate
Body: {
  method: "pearson", // or "spearman", "kendall"
  columns: ["revenue", "marketing_spend", "units_sold"]
}
Response: {
  correlation_matrix: [
    [1.0, 0.85, 0.92],
    [0.85, 1.0, 0.78],
    [0.92, 0.78, 1.0]
  ],
  columns: ["revenue", "marketing_spend", "units_sold"]
}

# Time series analysis
POST /api/v1/analytics/datasets/{dataset_id}/timeseries
Body: {
  date_column: "date",
  value_column: "revenue",
  frequency: "daily", // or "weekly", "monthly"
  forecast_periods: 30
}
Response: {
  trend: "increasing",
  seasonality: "weekly",
  forecast: [...], // Predicted values
  confidence_intervals: [...]
}
```

### 3. Machine Learning

```python
# Train model
POST /api/v1/analytics/datasets/{dataset_id}/ml/train
Body: {
  model_type: "regression", // or "classification", "clustering"
  algorithm: "linear_regression", // or "random_forest", "xgboost"
  target_column: "revenue",
  feature_columns: ["marketing_spend", "units_sold"],
  train_test_split: 0.8,
  parameters: {
    max_depth: 10,
    n_estimators: 100
  }
}
Response: {
  analysis_id: "uuid",
  status: "training",
  estimated_time: 60 // seconds
}

# Get model results
GET /api/v1/analytics/analyses/{analysis_id}
Response: {
  id: "uuid",
  status: "completed",
  model_type: "regression",
  metrics: {
    r2_score: 0.85,
    mse: 1250.50,
    mae: 25.30
  },
  feature_importance: {
    "marketing_spend": 0.65,
    "units_sold": 0.35
  },
  predictions: [...], // Test set predictions
  model_path: "s3://models/uuid.pkl"
}

# Make predictions
POST /api/v1/analytics/analyses/{analysis_id}/predict
Body: {
  data: [
    {"marketing_spend": 10000, "units_sold": 500},
    {"marketing_spend": 15000, "units_sold": 750}
  ]
}
Response: {
  predictions: [14500.25, 21750.50]
}
```

### 4. Visualization

```python
# Create chart
POST /api/v1/analytics/charts
Body: {
  dataset_id: "uuid",
  name: "Revenue Trend",
  chart_type: "line",
  configuration: {
    x_axis: "date",
    y_axis: ["revenue"],
    color_scheme: "blue",
    show_legend: true
  }
}
Response: {
  id: "uuid",
  name: "Revenue Trend",
  chart_type: "line",
  preview_url: "/api/v1/analytics/charts/uuid/render"
}

# Render chart as image
GET /api/v1/analytics/charts/{chart_id}/render?format=png&width=800&height=600
Response: <PNG image>

# Get chart data
GET /api/v1/analytics/charts/{chart_id}/data
Response: {
  labels: ["2026-01-01", "2026-01-02", ...],
  datasets: [
    {
      label: "Revenue",
      data: [15000, 16000, 14500, ...]
    }
  ]
}
```

### 5. Dashboard

```python
# Create dashboard
POST /api/v1/analytics/dashboards
Body: {
  name: "Sales Overview",
  description: "Q4 sales performance"
}
Response: {
  id: "uuid",
  name: "Sales Overview"
}

# Add widget to dashboard
POST /api/v1/analytics/dashboards/{dashboard_id}/widgets
Body: {
  widget_type: "chart",
  chart_id: "chart_uuid",
  position: {x: 0, y: 0, w: 6, h: 4}
}

# Get dashboard
GET /api/v1/analytics/dashboards/{dashboard_id}
Response: {
  id: "uuid",
  name: "Sales Overview",
  widgets: [
    {
      id: "widget_uuid",
      type: "chart",
      chart: {...},
      position: {x: 0, y: 0, w: 6, h: 4}
    }
  ]
}
```

### 6. Export

```python
# Export to PDF
POST /api/v1/analytics/dashboards/{dashboard_id}/export/pdf
Response: {
  download_url: "https://storage.../dashboard.pdf",
  expires_at: "2026-01-19T10:00:00Z"
}

# Export dataset to CSV
GET /api/v1/analytics/datasets/{dataset_id}/export/csv
Response: <CSV file download>

# Export analysis results to Excel
GET /api/v1/analytics/analyses/{analysis_id}/export/excel
Response: <Excel file download>
```

---

## 🧩 Component Architecture (Frontend)

### File Structure

```
frontend/src/app/(dashboard)/analytics/
├── page.tsx                          # Main analytics workspace
├── layout.tsx                        # Analytics layout
├── analytics.module.css              # Styles
├── components/
│   ├── DataUpload/
│   │   ├── FileUploader.tsx
│   │   ├── DataPreview.tsx
│   │   └── ColumnMapper.tsx
│   ├── DataTable/
│   │   ├── DataGrid.tsx
│   │   ├── Filters.tsx
│   │   └── Pagination.tsx
│   ├── Statistics/
│   │   ├── SummaryStats.tsx
│   │   ├── CorrelationMatrix.tsx
│   │   └── DistributionChart.tsx
│   ├── Charts/
│   │   ├── LineChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── PieChart.tsx
│   │   ├── ScatterPlot.tsx
│   │   ├── Heatmap.tsx
│   │   └── ChartBuilder.tsx
│   ├── MachineLearning/
│   │   ├── ModelTrainer.tsx
│   │   ├── FeatureSelector.tsx
│   │   ├── ModelResults.tsx
│   │   └── PredictionInterface.tsx
│   ├── Dashboard/
│   │   ├── DashboardBuilder.tsx
│   │   ├── WidgetGrid.tsx
│   │   └── WidgetCard.tsx
│   └── Export/
│       ├── ExportDialog.tsx
│       └── PDFPreview.tsx
├── [datasetId]/
│   └── page.tsx                      # Dataset detail page
├── upload/
│   └── page.tsx                      # Upload page
└── services/
    └── analyticsService.ts           # API calls
```

---

**Continue to Part 3 for Implementation Details...**
