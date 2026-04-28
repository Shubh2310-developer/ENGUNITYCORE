'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { analyticsService, Dataset, Chart, Analysis, DatasetStatistics, InsightsResponse } from '@/services/analytics';
import { LineChart, BarChart, PieChart, ScatterPlot, Heatmap, AreaChart, Histogram, BoxPlot } from '@/components/charts';
import {
  ArrowLeft,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Brain,
  Database,
  Plus,
  Trash2,
  RefreshCw,
  Lightbulb,
  Grid3X3,
  TrendingUp,
  Target,
  Box,
  AlertCircle,
  FileDown,
  ChevronDown,
  Download
} from 'lucide-react';

export default function DatasetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawDatasetId = params.datasetId as string;
  const isNumericId = /^\d+$/.test(rawDatasetId);
  const datasetId = isNumericId ? parseInt(rawDatasetId) : -1;

  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [statistics, setStatistics] = useState<DatasetStatistics | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'ml' | 'insights' | 'correlations'>('overview');
  const [showCreateChart, setShowCreateChart] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const [newChart, setNewChart] = useState({
    name: '',
    chart_type: 'bar' as Chart['chart_type'],
    x_axis: '',
    y_axis: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, [datasetId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    if (!isNumericId) {
      setError('This feature is currently available for uploaded datasets. Demo datasets can be viewed in the main dashboard.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [datasetData, statsData, chartsData, analysesData, insightsData] = await Promise.all([
        analyticsService.getDataset(datasetId),
        analyticsService.getDatasetStatistics(datasetId).catch(() => null),
        analyticsService.listCharts(datasetId).catch(() => []),
        analyticsService.listAnalyses(datasetId).catch(() => []),
        analyticsService.getInsights(datasetId).catch(() => ({ insights: [], anomalies: [] }))
      ]);

      setDataset(datasetData);
      setStatistics(statsData);
      setCharts(chartsData);
      setAnalyses(analysesData);
      setInsights(insightsData);
    } catch (err: unknown) {
      console.error('Error loading dataset:', err);
      setError(axios.isAxiosError(err) ? err.response?.data?.detail || 'Failed to load dataset' : 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      setShowExportMenu(false);
      const response = await analyticsService.exportDataset(datasetId, format);
      // In a real app, we might want to trigger a download or show a link
      if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      } else {
        alert('Export request submitted successfully.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Export failed: ' + (axios.isAxiosError(err) ? err.response?.data?.detail || message : message));
    }
  };

  const handleCreateChart = async () => {
    if (!newChart.name || (newChart.chart_type !== 'histogram' && !newChart.x_axis) || newChart.y_axis.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const config: Record<string, any> = {
        x_axis: newChart.x_axis,
        y_axis: newChart.y_axis,
      };

      if (newChart.chart_type === 'pie') {
        config.name_column = newChart.x_axis;
        config.value_column = newChart.y_axis[0];
      } else if (newChart.chart_type === 'histogram') {
        config.column = newChart.y_axis[0];
        config.bins = 10;
      } else if (newChart.chart_type === 'box') {
        config.column = newChart.y_axis[0];
        config.group_by = newChart.x_axis;
      }

      const chart = await analyticsService.createChart(datasetId, {
        name: newChart.name,
        chart_type: newChart.chart_type,
        config,
      });

      setCharts([...charts, chart]);
      setShowCreateChart(false);
      setNewChart({ name: '', chart_type: 'bar', x_axis: '', y_axis: [] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert('Failed to create chart: ' + (axios.isAxiosError(err) ? err.response?.data?.detail || message : message));
    }
  };

  const handleDeleteChart = async (chartId: number) => {
    if (!confirm('Delete this chart?')) return;

    try {
      await analyticsService.deleteChart(chartId);
      setCharts(charts.filter(c => c.id !== chartId));
    } catch (err: unknown) {
      alert('Failed to delete chart');
    }
  };

  const renderChart = (chart: Chart) => {
    const { chart_type, data } = chart;

    try {
      switch (chart_type) {
        case 'line':
          return <LineChart data={data.data || []} xKey={data.xKey || 'x'} yKeys={data.yKeys || []} title={chart.name} />;
        case 'bar':
          return <BarChart data={data.data || []} xKey={data.xKey || 'x'} yKeys={data.yKeys || []} title={chart.name} />;
        case 'pie':
          return <PieChart data={data.data || []} title={chart.name} />;
        case 'scatter':
          return <ScatterPlot data={data.data || []} xKey={data.xKey || 'x'} yKey={data.yKey || 'y'} title={chart.name} />;
        case 'heatmap':
          return <Heatmap data={data.data || []} title={chart.name} />;
        case 'area':
          return <AreaChart data={data.data || []} xKey={data.xKey || 'x'} yKeys={data.yKeys || []} title={chart.name} />;
        case 'histogram':
          return <Histogram data={data.data || []} title={chart.name} />;
        case 'box':
          return <BoxPlot data={data.data || []} title={chart.name} />;
        default:
          return <div className="text-gray-500">Unsupported chart type</div>;
      }
    } catch (error) {
      console.error('Chart rendering error:', error);
      return <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-100 text-sm">Error rendering chart: {chart.name}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (error || !dataset) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Dataset not found'}</p>
          <button
            onClick={() => router.push('/analytics')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Analytics
          </button>
        </div>
      </div>
    );
  }

  const columns = dataset.columns_info?.map(c => c.name) || [];
  const numericColumns = dataset.columns_info?.filter(c => 
    c.dtype.includes('int') || c.dtype.includes('float')
  ).map(c => c.name) || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <button
          onClick={() => router.push('/analytics')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analytics
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{dataset.name}</h1>
            {dataset.description && (
              <p className="text-gray-600">{dataset.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-blue-600" />
                Export
                <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                    Select Format
                  </div>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    CSV Spreadsheet
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    JSON Data
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Excel Workbook
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={loadData}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-gray-200 transition-all shadow-sm bg-white"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <Database className="w-6 h-6 text-blue-600 mb-2" />
          <div className="text-2xl font-bold">{dataset.row_count?.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Rows</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <BarChart3 className="w-6 h-6 text-green-600 mb-2" />
          <div className="text-2xl font-bold">{dataset.column_count}</div>
          <div className="text-sm text-gray-600">Columns</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <LineChartIcon className="w-6 h-6 text-purple-600 mb-2" />
          <div className="text-2xl font-bold">{charts.length}</div>
          <div className="text-sm text-gray-600">Charts</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <Brain className="w-6 h-6 text-orange-600 mb-2" />
          <div className="text-2xl font-bold">{analyses.length}</div>
          <div className="text-sm text-gray-600">ML Analyses</div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Database },
            { id: 'charts', label: 'Charts', icon: BarChart3 },
            { id: 'insights', label: 'AI Insights', icon: Lightbulb },
            { id: 'correlations', label: 'Correlations', icon: Grid3X3 },
            { id: 'ml', label: 'Machine Learning', icon: Brain },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'charts' && charts.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {charts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {statistics && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Dataset Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Summary</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Total Rows:</dt>
                      <dd className="font-medium">{statistics.summary.total_rows?.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Total Columns:</dt>
                      <dd className="font-medium">{statistics.summary.total_columns}</dd>
                    </div>
                  </dl>
                </div>
                {Object.keys(statistics.missing_values).length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Missing Values</h3>
                    <dl className="space-y-2">
                      {Object.entries(statistics.missing_values).slice(0, 5).map(([col, count]) => (
                        <div key={col} className="flex justify-between">
                          <dt className="text-gray-600 truncate mr-2">{col}:</dt>
                          <dd className="font-medium">{count}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Columns</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-medium text-gray-900">Name</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-900">Null Count</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-900">Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.columns_info?.map((col, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium">{col.name}</td>
                      <td className="py-2 px-4 text-gray-600">{col.dtype}</td>
                      <td className="py-2 px-4 text-gray-600">{col.null_count}</td>
                      <td className="py-2 px-4 text-gray-600">{col.unique_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Charts</h2>
            <button
              onClick={() => setShowCreateChart(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Chart
            </button>
          </div>

          {charts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <PieChartIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No charts yet. Create your first chart!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {charts.map((chart) => (
                <div key={chart.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900">{chart.name}</h3>
                    <button
                      onClick={() => handleDeleteChart(chart.id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {renderChart(chart)}
                </div>
              ))}
            </div>
          )}

          {showCreateChart && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold mb-4">Create Chart</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Chart Name</label>
                    <input
                      type="text"
                      value={newChart.name}
                      onChange={(e) => setNewChart({ ...newChart, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="My Chart"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Chart Type</label>
                    <select
                      value={newChart.chart_type}
                      onChange={(e) => setNewChart({ ...newChart, chart_type: e.target.value as any })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="bar">Bar Chart</option>
                      <option value="line">Line Chart</option>
                      <option value="pie">Pie Chart</option>
                      <option value="area">Area Chart</option>
                      <option value="scatter">Scatter Plot</option>
                      <option value="histogram">Histogram</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">X Axis</label>
                    <select
                      value={newChart.x_axis}
                      onChange={(e) => setNewChart({ ...newChart, x_axis: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select column...</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Y Axis</label>
                    <select
                      multiple
                      value={newChart.y_axis}
                      onChange={(e) => setNewChart({ 
                        ...newChart, 
                        y_axis: Array.from(e.target.selectedOptions, option => option.value)
                      })}
                      className="w-full px-3 py-2 border rounded-lg"
                      size={4}
                    >
                      {numericColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateChart(false)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateChart}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">AI Insights</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {insights?.insights?.length || 0} Insights
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                {insights?.anomalies?.length || 0} Anomalies
              </span>
            </div>
          </div>

          {!insights || (insights.insights.length === 0 && insights.anomalies.length === 0) ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No automated insights found yet.</p>
              <p className="text-sm text-gray-500">Try refreshing or uploading a more complex dataset.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.anomalies.map((anomaly, idx: number) => (
                <div key={`anomaly-${idx}`} className="bg-red-50 border border-red-100 rounded-xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <AlertCircle className="w-24 h-24 text-red-900" />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-bold text-red-900 text-lg">{anomaly.title}</h3>
                  </div>
                  <p className="text-red-800 mb-4 leading-relaxed">{anomaly.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-100 px-2 py-1 rounded">Anomaly</span>
                    <span className="text-xs text-red-500 font-medium">{new Date(anomaly.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {insights.insights.map((insight, idx: number) => (
                <div key={`insight-${idx}`} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    {insight.type === 'correlation' ? <Grid3X3 className="w-24 h-24" /> : <Lightbulb className="w-24 h-24" />}
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      {insight.type === 'correlation' ? (
                        <Grid3X3 className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{insight.title}</h3>
                  </div>
                  <p className="text-slate-600 mb-4 leading-relaxed">{insight.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">
                        {insight.type}
                      </span>
                      {insight.confidence && (
                        <div className="flex items-center gap-1">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${insight.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{(insight.confidence * 100).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{new Date(insight.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'correlations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feature Correlations</h2>
            <p className="text-sm text-gray-500">Relationships between numeric columns (-1 to 1)</p>
          </div>

          {statistics?.correlations ? (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="py-3 px-4 text-left font-semibold text-slate-900 border-r border-slate-200 sticky left-0 bg-slate-50 z-10">
                        Feature
                      </th>
                      {Object.keys(statistics.correlations).map(col => (
                        <th key={col} className="py-3 px-2 text-center font-semibold text-slate-900 min-w-[100px] border-r border-slate-200">
                          <div className="truncate w-24 mx-auto" title={col}>{col}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(statistics.correlations).map(([rowKey, rowValues]: [string, any]) => (
                      <tr key={rowKey} className="border-b border-slate-200 last:border-0 group">
                        <td className="py-3 px-4 text-left font-medium text-slate-700 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                          <div className="truncate w-32" title={rowKey}>{rowKey}</div>
                        </td>
                        {Object.entries(rowValues).map(([colKey, val]: [string, any]) => {
                          const value = val as number;
                          const intensity = Math.abs(value);
                          const isPositive = value > 0;

                          // Color based on correlation strength and direction
                          let bgColor = 'transparent';
                          let textColor = 'inherit';

                          if (intensity > 0.05) {
                            if (isPositive) {
                              bgColor = `rgba(59, 130, 246, ${intensity * 0.8})`; // Blue for positive
                              textColor = intensity > 0.5 ? 'white' : 'black';
                            } else {
                              bgColor = `rgba(239, 68, 68, ${intensity * 0.8})`; // Red for negative
                              textColor = intensity > 0.5 ? 'white' : 'black';
                            }
                          }

                          return (
                            <td
                              key={colKey}
                              className="py-3 px-2 text-center text-sm border-r border-slate-200 transition-colors"
                              style={{ backgroundColor: bgColor, color: textColor }}
                              title={`${rowKey} vs ${colKey}: ${value.toFixed(4)}`}
                            >
                              {value.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Grid3X3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Insufficient numeric data for correlation matrix.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ml' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Machine Learning Analysis</h2>
          </div>

          {analyses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No ML analyses yet.</p>
              <p className="text-sm text-gray-500 italic mt-2 text-balance max-w-md mx-auto">
                Train models to predict values or discover hidden patterns in your data.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{analysis.name}</h3>
                      <p className="text-sm text-gray-600">{analysis.analysis_type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      analysis.status === 'completed' ? 'bg-green-100 text-green-800' :
                      analysis.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {analysis.status.toUpperCase()}
                    </span>
                  </div>
                  {analysis.results && analysis.results.test_metrics && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Test Metrics:</p>
                      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(analysis.results.test_metrics as Record<string, unknown>).map(([key, value]) => (
                          <div key={key} className="bg-slate-50 p-2 rounded border border-slate-100">
                            <dt className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{key}</dt>
                            <dd className="text-lg font-bold text-slate-800">{typeof value === 'number' ? value.toFixed(4) : String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
