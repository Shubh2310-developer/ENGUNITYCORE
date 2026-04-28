import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Ensure API_URL ends with /api/v1
const getBaseUrl = () => {
  let url = API_URL;
  if (!url.includes('/api/v1')) {
    url = url.endsWith('/') ? `${url}api/v1` : `${url}/api/v1`;
  }
  return url;
};

const FINAL_API_URL = getBaseUrl();

export interface Dataset {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  row_count?: number;
  column_count?: number;
  columns_info?: ColumnInfo[];
  status: 'uploading' | 'processing' | 'ready' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnInfo {
  name: string;
  dtype: string;
  null_count: number;
  unique_count?: number;
  sample_values?: (string | number | boolean | null)[];
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  median?: number;
  null_percentage?: number;
  top_values?: { value: string | number | boolean | null; count: number }[];
}

export interface DatasetStatistics {
  dataset_id: number;
  summary: {
    total_rows: number;
    total_columns: number;
    numeric_columns?: number;
    categorical_columns?: number;
    memory_usage?: number;
  };
  numeric_stats?: Record<string, any>;
  categorical_stats?: Record<string, any>;
  missing_values: Record<string, number>;
  correlations?: CorrelationData;
}

export interface Analysis {
  id: number;
  dataset_id: number;
  user_id: number;
  name: string;
  analysis_type: 'descriptive' | 'correlation' | 'regression' | 'classification' | 'clustering' | 'time_series';
  parameters?: Record<string, any>;
  results?: Record<string, any>;
  status: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface Chart {
  id: number;
  dataset_id: number;
  analysis_id?: number;
  user_id: number;
  name: string;
  chart_type: 'line' | 'bar' | 'pie' | 'scatter' | 'histogram' | 'heatmap' | 'box' | 'area';
  config: Record<string, any>;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChartCreate {
  name: string;
  chart_type: Chart['chart_type'];
  config: Record<string, any>;
  analysis_id?: number;
}

export interface RegressionRequest {
  target_column: string;
  feature_columns: string[];
  test_size?: number;
  model_type?: 'linear' | 'ridge' | 'lasso' | 'elasticnet' | 'random_forest' | 'gradient_boosting';
}

export interface ClassificationRequest {
  target_column: string;
  feature_columns: string[];
  test_size?: number;
  model_type?: 'logistic' | 'decision_tree' | 'random_forest' | 'svm' | 'gradient_boosting';
}

export interface ClusteringRequest {
  feature_columns: string[];
  n_clusters?: number;
  algorithm?: 'kmeans' | 'dbscan' | 'hierarchical';
}

export interface ColumnMetadata {
  name: string;
  type: 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text';
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  mostFrequent?: string | number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  distribution?: string;
  samples: (string | number | boolean | null)[];
}

export interface DataPreview {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  totalRows: number;
  page: number;
  pageSize: number;
  pagination?: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CorrelationData {
  matrix: number[][];
  columns: string[];
  strongCorrelations?: {
    feature1: string;
    feature2: string;
    correlation: number;
  }[];
  correlations?: Record<string, Record<string, number>>;
}

export interface ChartConfig {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'donut' | 'column' | 'heatmap' | 'histogram' | 'box';
  title: string;
  xAxis: string;
  yAxis: string;
  color?: string;
  filters?: Record<string, string | number | boolean | null>;
  data?: Record<string, string | number | boolean | null>[];
}

export interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  totalRows: number;
  executionTime?: string;
  sql?: string;
  insight?: string;
}

export interface QueryHistory {
  id: string;
  query: string;
  type: 'SQL' | 'NLQ';
  timestamp: string;
  executionTime: string;
  favorite: boolean;
  results?: QueryResult;
}

export interface AIInsight {
  type: 'correlation' | 'anomaly' | 'trend' | 'pattern' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  data: Record<string, string | number | boolean | null | Record<string, any>>;
  timestamp: string;
}

export interface DataSummary {
  rows: number;
  columns: number;
  missingValues: string;
  dataQuality: string;
  numericalColumns: Record<string, {
    distribution: string;
    mean: number;
    std: number;
    min: number;
    max: number;
  }>;
  categoricalColumns: Record<string, {
    unique_count: number;
    most_frequent: string;
  }>;
  fileSize: string;
  uploadDate: string;
  processingTime?: string;
}

export interface ChartsData {
  revenueTrend: { month: string; revenue: number }[];
  salesByMonth: { month: string; sales: number }[];
  departmentDistribution: { name: string; value: number }[];
  salesVsRevenue: { sales: number; revenue: number }[];
  customCharts?: ChartConfig[];
}

export interface UploadedFile {
  name: string;
  size: string;
  rows: number;
  columns: number;
  fileId: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  uploadDate?: string;
  metadata?: Record<string, any>;
}

export interface Insight {
  title: string;
  description: string;
  type: string;
  confidence?: number;
  timestamp: string;
  data?: any;
}

export interface PredictionResult {
  prediction_type: 'regression' | 'classification';
  model_performance: {
    test_samples: number;
    r2_score?: number;
    accuracy?: number;
    mean_squared_error?: number;
  };
  feature_importance: {
    feature: string;
    importance: number;
  }[];
  predictions_sample: {
    actual: number | string;
    predicted: number | string;
  }[];
}

export interface Anomaly {
  title: string;
  description: string;
  timestamp: string;
}

export interface InsightsResponse {
  insights: Insight[];
  anomalies: Anomaly[];
}

export type AskAnalysisType = 'trend' | 'comparison' | 'distribution' | 'anomaly' | 'prediction' | 'summary';
export type AskChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'area' | 'histogram' | 'box';

export interface AskDataAnalysisRequest {
  query: string;
  dataset_id: number;
  time_range?: string;
  data_source?: string;
}

export interface AskDataInsight {
  insight_type: string;
  title: string;
  description: string;
  confidence: number;
  data_points?: Record<string, any>[];
}

export interface AskChartConfig {
  chart_type: AskChartType;
  title: string;
  x_label: string;
  y_label: string;
  data: Record<string, any>[];
  colors?: string[];
}

export interface AskDataAnalysisResponse {
  query: string;
  analysis_type: AskAnalysisType;
  summary: string;
  insights: AskDataInsight[];
  chart?: AskChartConfig;
  raw_data?: Record<string, any>[];
  suggested_queries: string[];
  processing_time: number;
}

class AnalyticsService {
  private getAuthHeaders() {
    const token = useAuthStore.getState().token;
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  // ==================== Dataset Management ====================

  async uploadDataset(file: File, name: string, description?: string): Promise<Dataset> {
    const formData = new FormData();
    formData.append('file', file);

    const token = useAuthStore.getState().token;
    const params = new URLSearchParams();
    params.append('name', name);
    if (description) params.append('description', description);

    const response = await axios.post(
      `${FINAL_API_URL}/analytics/datasets/upload?${params.toString()}`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
      }
    );
    return response.data;
  }

  async listDatasets(skip: number = 0, limit: number = 100): Promise<Dataset[]> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/datasets`, {
      headers: this.getAuthHeaders(),
      params: { skip, limit },
    });
    return response.data;
  }

  async getDataset(datasetId: number): Promise<Dataset> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/datasets/${datasetId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getDatasetData(datasetId: number, skip: number = 0, limit: number = 100): Promise<any> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/datasets/${datasetId}/data`, {
      headers: this.getAuthHeaders(),
      params: { skip, limit },
    });
    return response.data;
  }

  async deleteDataset(datasetId: number): Promise<void> {
    await axios.delete(`${FINAL_API_URL}/analytics/datasets/${datasetId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==================== Statistics ====================

  async getDatasetStatistics(datasetId: number): Promise<DatasetStatistics> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/datasets/${datasetId}/statistics`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  // ==================== Machine Learning ====================

  async trainRegression(datasetId: number, request: RegressionRequest): Promise<Analysis> {
    const response = await axios.post(
      `${FINAL_API_URL}/analytics/datasets/${datasetId}/ml/regression`,
      request,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async trainClassification(datasetId: number, request: ClassificationRequest): Promise<Analysis> {
    const response = await axios.post(
      `${FINAL_API_URL}/analytics/datasets/${datasetId}/ml/classification`,
      request,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async performClustering(datasetId: number, request: ClusteringRequest): Promise<Analysis> {
    const response = await axios.post(
      `${FINAL_API_URL}/analytics/datasets/${datasetId}/ml/clustering`,
      request,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  // ==================== Charts ====================

  async createChart(datasetId: number, chartData: ChartCreate): Promise<Chart> {
    const response = await axios.post(
      `${FINAL_API_URL}/analytics/datasets/${datasetId}/charts`,
      chartData,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async listCharts(datasetId: number): Promise<Chart[]> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/datasets/${datasetId}/charts`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getChart(chartId: number): Promise<Chart> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/charts/${chartId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateChart(chartId: number, updates: Partial<ChartCreate>): Promise<Chart> {
    const response = await axios.put(
      `${FINAL_API_URL}/analytics/charts/${chartId}`,
      updates,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async deleteChart(chartId: number): Promise<void> {
    await axios.delete(`${FINAL_API_URL}/analytics/charts/${chartId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==================== Analyses ====================

  async listAnalyses(datasetId: number): Promise<Analysis[]> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/datasets/${datasetId}/analyses`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async getAnalysis(analysisId: number): Promise<Analysis> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/analyses/${analysisId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async deleteAnalysis(analysisId: number): Promise<void> {
    await axios.delete(`${FINAL_API_URL}/analytics/analyses/${analysisId}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ==================== Query Execution ====================

  async executeQuery(datasetId: number, query: string, queryType: 'sql' | 'nlq' = 'sql'): Promise<any> {
    const response = await axios.post(
      `${FINAL_API_URL}/analytics/datasets/${datasetId}/query`,
      null,
      {
        headers: this.getAuthHeaders(),
        params: { query, query_type: queryType },
      }
    );
    return response.data;
  }

  // ==================== Data Cleaning ====================

  async cleanDataset(datasetId: number, operations: any[]): Promise<any> {
    const response = await axios.post(
      `${FINAL_API_URL}/analytics/datasets/${datasetId}/clean`,
      null,
      {
        headers: this.getAuthHeaders(),
        params: { operations: JSON.stringify(operations) },
      }
    );
    return response.data;
  }

  // ==================== Insights & Export ====================

  async getInsights(datasetId: number): Promise<InsightsResponse> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/datasets/${datasetId}/insights`, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async exportDataset(datasetId: number, format: string): Promise<{ downloadUrl: string, filename: string }> {
    const response = await axios.get(`${FINAL_API_URL}/analytics/datasets/${datasetId}/export`, {
      headers: this.getAuthHeaders(),
      params: { format },
    });
    return response.data;
  }

  async askData(
    request: AskDataAnalysisRequest,
    options?: { signal?: AbortSignal }
  ): Promise<AskDataAnalysisResponse> {
    const response = await axios.post(
      `${FINAL_API_URL}/analytics/ask`,
      request,
      {
        headers: this.getAuthHeaders(),
        signal: options?.signal,
      }
    );
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
