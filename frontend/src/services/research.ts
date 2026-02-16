import { API_BASE } from './config';

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
    event_type: 'status' | 'sub_query' | 'source_found' | 'insight' | 'progress' | 'complete' | 'error';
    data: Record<string, any>;
    timestamp: string;
    progress_percent: number;
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
        const response = await fetch(`${API_BASE}/api/v1/research/deep-research/stream`, {
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
