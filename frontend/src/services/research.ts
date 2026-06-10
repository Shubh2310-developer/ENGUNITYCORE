import { API_BASE } from './config';
import type { ToolKey } from '@/types/research';

// Re-export so callers can import ToolKey from either the service or the types
// file without breaking existing imports.
export type { ToolKey };

const getUrl = (path: string): string => {
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (base.endsWith('/api/v1') && normalizedPath.startsWith('/api/v1')) {
    return `${base}${normalizedPath.substring(7)}`;
  }
  return `${base}${normalizedPath}`;
};

export interface ResearchRequest {
    query: string;
    depth: 'quick' | 'standard' | 'deep' | 'exhaustive';
    max_iterations?: number;
    include_web_search?: boolean;
    include_graph_search?: boolean;
    focus_areas?: string[];
    output_format?: 'detailed' | 'summary' | 'bullet_points';
}

export interface ResearchStreamEvent {
    event_type: 'status' | 'sub_query' | 'source_found' | 'search_query' | 'evaluation' | 'insight' | 'progress' | 'complete' | 'error';
    data: Record<string, any>;
    timestamp: string;
    progress_percent: number;
}


export interface ToolInvokeResult {
  tool: ToolKey;
  result: Record<string, any>;
  generated_at?: string;
}

export async function fetchSources(token: string): Promise<any[]> {
  const response = await fetch(getUrl('/api/v1/research/workspace/sources'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sources: ${response.status}`);
  }
  const data = await response.json();
  // Backend returns { sources: [...], project_id: null }
  return Array.isArray(data) ? data : (data.sources ?? []);
}

export async function fetchClusters(token: string): Promise<any[]> {
  const response = await fetch(getUrl('/api/v1/research/workspace/clusters'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch clusters: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data.clusters ?? []);
}

export async function fetchGraphNodes(token: string): Promise<any[]> {
  const response = await fetch(getUrl('/api/v1/research/workspace/graph-nodes'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch graph nodes: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : (data.nodes ?? []);
}

export async function invokeTool(
  tool: ToolKey,
  context: string,
  sourceTitles: string[] = [],
  token: string
): Promise<ToolInvokeResult> {
  const response = await fetch(getUrl('/api/v1/research/workspace/tool-invoke'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tool, context, source_titles: sourceTitles }),
  });

  if (!response.ok) {
    throw new Error(`Failed to invoke tool: ${response.status}`);
  }

  return response.json();
}

export interface SourceEvaluation {
    source_id: string;
    source_name: string;
    source_type: string;
    relevance_score: number;
    quality_score: number;
    content_snippet: string;
    url?: string;
}

export interface ResearchReport {
    id: string;
    query: string;
    summary: string;
    detailed_findings: Array<{ full_report: string }>;
    key_insights: string[];
    sources: SourceEvaluation[];
    overall_confidence: number;
    coverage_score: number;
    related_topics: string[];
    follow_up_questions: string[];
    duration_seconds: number;
}

export async function startDeepResearch(
    request: ResearchRequest,
    token: string,
    onEvent: (event: ResearchStreamEvent) => void,
    onComplete: (report: ResearchReport) => void,
    onError: (error: string) => void
): Promise<void> {
    try {
        const response = await fetch(getUrl('/api/v1/research/deep-research/stream'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            // Keep the last partial line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const eventData = JSON.parse(line.slice(6));
                        // Handle error event type
                        if (eventData.event_type === 'error') {
                            onError(eventData.data.message);
                            return;
                        }

                        const event: ResearchStreamEvent = eventData;
                        onEvent(event);

                        if (event.event_type === 'complete') {
                            onComplete(event.data.report);
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }
            }
        }
    } catch (err: any) {
        onError(err.message || 'Unknown error occurred');
    }
}
