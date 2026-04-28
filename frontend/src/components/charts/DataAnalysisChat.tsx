'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  analyticsService,
  AskChartConfig,
  AskDataAnalysisResponse,
  AIInsight,
  ChartConfig,
} from '@/services/analytics';
import { AreaChart, BarChart, BoxPlot, Heatmap, Histogram, LineChart, PieChart, ScatterPlot } from '@/components/charts';
import { AlertTriangle, Brain, RefreshCw, Send, XCircle } from 'lucide-react';

interface DataAnalysisChatProps {
  datasetId: number | null;
  onApplyResult: (payload: { insights: AIInsight[]; chart?: ChartConfig; result: AskDataAnalysisResponse }) => void;
}

const MAX_VISIBLE_CHART_POINTS = 300;
const SUBMIT_DEBOUNCE_MS = 350;

const normalizeChartData = (chart?: AskChartConfig): Record<string, string | number | boolean | null>[] => {
  if (!chart || !Array.isArray(chart.data)) return [];
  const clipped = chart.data.slice(0, MAX_VISIBLE_CHART_POINTS);
  return clipped.map((row) => {
    if (!row || typeof row !== 'object') return {};
    const normalized: Record<string, string | number | boolean | null> = {};
    Object.entries(row).forEach(([key, value]) => {
      if (
        value === null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        normalized[key] = value;
      }
    });
    return normalized;
  });
};

const toChartConfig = (chart?: AskChartConfig): ChartConfig | null => {
  if (!chart || !Array.isArray(chart.data) || chart.data.length === 0) return null;

  const type = chart.chart_type;
  if (!['line', 'bar', 'pie', 'scatter', 'heatmap', 'area', 'histogram', 'box'].includes(type)) {
    return null;
  }

  return {
    id: `ask-${Date.now()}`,
    type: type as ChartConfig['type'],
    title: chart.title || 'AI Chart',
    xAxis: chart.x_label || 'x',
    yAxis: chart.y_label || 'y',
    data: normalizeChartData(chart),
  };
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export default function DataAnalysisChat({ datasetId, onApplyResult }: DataAnalysisChatProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AskDataAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSubmitAtRef = useRef(0);

  const canAsk = Boolean(datasetId) && query.trim().length >= 5 && !loading;

  const telemetry = (event: string, payload: Record<string, unknown>) => {
    console.info('analytics.ask.telemetry', { event, ...payload });
  };

  const applyResult = (response: AskDataAnalysisResponse) => {
    const mappedInsights: AIInsight[] = (response.insights || []).map((insight) => ({
      type: ['correlation', 'anomaly', 'trend', 'pattern', 'prediction'].includes(insight.insight_type)
        ? (insight.insight_type as AIInsight['type'])
        : 'pattern',
      title: insight.title,
      description: insight.description,
      confidence: insight.confidence,
      data: { data_points: insight.data_points || [] },
      timestamp: new Date().toISOString(),
    }));

    const chartConfig = toChartConfig(response.chart);
    onApplyResult({ insights: mappedInsights, chart: chartConfig || undefined, result: response });
  };

  const submitAsk = async (forcedQuery?: string, options?: { bypassDebounce?: boolean }) => {
    const now = Date.now();
    if (!options?.bypassDebounce && now - lastSubmitAtRef.current < SUBMIT_DEBOUNCE_MS) {
      return;
    }
    lastSubmitAtRef.current = now;

    const value = (forcedQuery ?? query).trim();
    if (!datasetId || value.length < 5) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    setFollowUpError(null);
    const requestStartedAt = Date.now();
    setAttempts((prev) => prev + 1);
    telemetry('request_started', { datasetId, queryLength: value.length, attempts: attempts + 1 });

    try {
      const response = await analyticsService.askData(
        {
          query: value,
          dataset_id: datasetId,
          time_range: '30d',
          data_source: 'analytics',
        },
        { signal: controller.signal }
      );

      setResult(response);
      applyResult(response);
      telemetry('request_success', {
        datasetId,
        latencyMs: Date.now() - requestStartedAt,
        processingMs: Math.round(response.processing_time * 1000),
        hasChart: Boolean(response.chart),
      });
    } catch (err: unknown) {
      const cancelCandidate = err as { name?: string; code?: string };
      if (cancelCandidate.name === 'CanceledError' || cancelCandidate.code === 'ERR_CANCELED') {
        telemetry('request_cancelled', { datasetId });
        return;
      }

      const axiosError = err as {
        response?: { data?: { detail?: { message?: string } | string } };
      };
      const safeMessage =
        (typeof axiosError.response?.data?.detail === 'object'
          ? axiosError.response?.data?.detail?.message
          : undefined) ||
        (typeof axiosError.response?.data?.detail === 'string'
          ? axiosError.response.data.detail
          : undefined) ||
        'Unable to analyze data right now. Try again.';
      setError(String(safeMessage));
      telemetry('request_failure', { datasetId, message: safeMessage });
    } finally {
      setLoading(false);
    }
  };

  const cancelAsk = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
  };

  const chartPreview = useMemo(() => {
    const chart = result?.chart;
    if (!chart) return null;

    const data = normalizeChartData(chart);
    if (!data.length) return <div className="text-sm text-slate-500">Chart data is empty.</div>;

    try {
      if (chart.chart_type === 'line') {
        const xKey = chart.x_label || Object.keys(data[0] || {})[0] || 'x';
        const yKey = chart.y_label || Object.keys(data[0] || {})[1] || 'y';
        return <LineChart data={data} xKey={xKey} yKeys={[yKey]} height={260} title={chart.title} />;
      }

      if (chart.chart_type === 'bar') {
        const xKey = chart.x_label || Object.keys(data[0] || {})[0] || 'x';
        const yKey = chart.y_label || Object.keys(data[0] || {})[1] || 'y';
        return <BarChart data={data} xKey={xKey} yKeys={[yKey]} height={260} title={chart.title} />;
      }

      if (chart.chart_type === 'pie') {
        const xKey = chart.x_label || Object.keys(data[0] || {})[0] || 'name';
        const yKey = chart.y_label || Object.keys(data[0] || {})[1] || 'value';
        const pieData = data.map((row) => ({
          name: String(row[xKey] ?? 'Unknown'),
          value: asNumber(row[yKey]) ?? 0,
        }));
        return <PieChart data={pieData} height={260} title={chart.title} />;
      }

      if (chart.chart_type === 'scatter') {
        const xKey = chart.x_label || Object.keys(data[0] || {})[0] || 'x';
        const yKey = chart.y_label || Object.keys(data[0] || {})[1] || 'y';
        const scatterData = data
          .map((row) => ({ x: asNumber(row[xKey]), y: asNumber(row[yKey]) }))
          .filter((row) => row.x !== null && row.y !== null)
          .map((row) => ({ x: row.x as number, y: row.y as number }));
        if (!scatterData.length) return <div className="text-sm text-slate-500">Scatter data is invalid.</div>;
        return <ScatterPlot data={scatterData} height={260} title={chart.title} />;
      }

      if (chart.chart_type === 'area') {
        const xKey = chart.x_label || Object.keys(data[0] || {})[0] || 'x';
        const yKey = chart.y_label || Object.keys(data[0] || {})[1] || 'y';
        return <AreaChart data={data} xKey={xKey} yKeys={[yKey]} height={260} title={chart.title} />;
      }

      if (chart.chart_type === 'histogram') {
        const rangeKey = chart.x_label || Object.keys(data[0] || {})[0] || 'range';
        const countKey = chart.y_label || Object.keys(data[0] || {})[1] || 'count';
        const histogramData = data.map((row) => ({
          range: String(row[rangeKey] ?? ''),
          count: asNumber(row[countKey]) ?? 0,
        }));
        return <Histogram data={histogramData} height={260} title={chart.title} />;
      }

      if (chart.chart_type === 'box') {
        const boxed = data
          .map((row, index) => ({
            name: String(row.name ?? row[chart.x_label] ?? `Group ${index + 1}`),
            min: asNumber(row.min),
            q1: asNumber(row.q1),
            median: asNumber(row.median),
            q3: asNumber(row.q3),
            max: asNumber(row.max),
          }))
          .filter((row) => row.min !== null && row.q1 !== null && row.median !== null && row.q3 !== null && row.max !== null)
          .map((row) => ({
            name: row.name,
            min: row.min as number,
            q1: row.q1 as number,
            median: row.median as number,
            q3: row.q3 as number,
            max: row.max as number,
          }));
        if (!boxed.length) return <div className="text-sm text-slate-500">Box-plot data is invalid.</div>;
        return <BoxPlot data={boxed} height={260} title={chart.title} />;
      }

      if (chart.chart_type === 'heatmap') {
        const xKey = chart.x_label || Object.keys(data[0] || {})[0] || 'x';
        const yKey = chart.y_label || Object.keys(data[0] || {})[1] || 'y';
        const valueKey = Object.keys(data[0] || {}).find((key) => key !== xKey && key !== yKey) || 'value';
        const heatmapData = data.map((row) => ({
          x: String(row[xKey] ?? ''),
          y: String(row[yKey] ?? ''),
          value: asNumber(row[valueKey]) ?? 0,
        }));
        return <Heatmap data={heatmapData} height={280} title={chart.title} />;
      }

      return <div className="text-sm text-slate-500">Chart type is not supported.</div>;
    } catch {
      return <div className="text-sm text-slate-500">Chart preview is unavailable for this response.</div>;
    }
  }, [result]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-800">Ask Your Data</h3>
      </div>

      <div className="space-y-2">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Show which category has the highest average value in this dataset"
          className="w-full min-h-24 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={!datasetId || loading}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => submitAsk()}
            disabled={!canAsk}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Ask'}
          </button>
          <button
            onClick={cancelAsk}
            disabled={!loading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <XCircle className="w-4 h-4" /> Cancel
          </button>
          {error && (
            <button
              onClick={() => submitAsk()}
              disabled={!datasetId || loading}
              className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          )}
          {!datasetId && <span className="text-xs text-slate-500">Select a dataset first.</span>}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-3 rounded-md border border-slate-200 bg-slate-50">
            <p className="text-sm font-semibold text-slate-700 mb-1">Summary</p>
            <p className="text-sm text-slate-700">{result.summary}</p>
            <p className="text-xs text-slate-500 mt-2">Latency: {(result.processing_time * 1000).toFixed(0)}ms</p>
          </div>

          {chartPreview && (
            <div className="border border-slate-200 rounded-md p-3 sm:p-4">
              {chartPreview}
            </div>
          )}

          {Array.isArray(result.suggested_queries) && result.suggested_queries.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Follow-up questions</p>
              <div className="flex flex-wrap gap-2">
                {result.suggested_queries.map((suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    onClick={async () => {
                      try {
                        setQuery(suggestion);
                        await submitAsk(suggestion, { bypassDebounce: true });
                      } catch {
                        setFollowUpError('Could not run follow-up question.');
                      }
                    }}
                    className="px-3 py-1.5 text-xs sm:text-sm bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              {followUpError && <p className="text-xs text-red-600 mt-2">{followUpError}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
