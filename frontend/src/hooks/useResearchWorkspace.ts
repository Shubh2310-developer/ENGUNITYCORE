'use client';

/**
 * useResearchWorkspace
 * =====================
 * Loads sources, clusters, and graph-nodes from the backend on mount.
 * Falls back to the static mock data on any network error so the page
 * never breaks if the backend is unavailable.
 *
 * Also exposes `invokeTool(toolKey, context, sources?)` which posts to
 * /api/v1/research/workspace/tool-invoke and caches results per tool key.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchSources,
  fetchClusters,
  fetchGraphNodes,
  invokeTool as apiInvokeTool,
  type ToolKey,
  type ToolInvokeResult,
} from '@/services/research';

// ─── Static fallbacks (same as mock data) ─────────────────────────────────────
import {
  SOURCES,
  CLUSTERS,
  GRAPH_NODES,
} from '@/data/research-mock-data';

import type {
  ResearchSource,
  ResearchCluster,
  GraphNode,
} from '@/types/research';

export interface UseResearchWorkspaceReturn {
  /** Live / fallback sources */
  sources: ResearchSource[];
  /** Live / fallback clusters */
  clusters: ResearchCluster[];
  /** Live / fallback graph nodes */
  graphNodes: GraphNode[];
  /** Whether the initial data fetch is still in flight */
  isLoading: boolean;
  /** Per-tool loading state */
  toolLoading: Record<string, boolean>;
  /** Results keyed by tool key */
  toolResults: Record<string, ToolInvokeResult>;
  /** Invoke an AI intelligence tool */
  invokeTool: (tool: ToolKey, context: string, sources?: string[]) => Promise<void>;
}

export function useResearchWorkspace(): UseResearchWorkspaceReturn {
  const token = useAuthStore((s) => s.token);

  const [sources, setSources]       = useState<ResearchSource[]>(SOURCES);
  const [clusters, setClusters]     = useState<ResearchCluster[]>(CLUSTERS);
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>(GRAPH_NODES);
  const [isLoading, setIsLoading]   = useState(false);
  const [toolLoading, setToolLoading] = useState<Record<string, boolean>>({});
  const [toolResults, setToolResults] = useState<Record<string, ToolInvokeResult>>({});

  // Track if the component is still mounted to avoid state updates after unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Fetch workspace data on mount (requires token) ────────────────────────
  useEffect(() => {
    if (!token) return;

    setIsLoading(true);
    Promise.allSettled([
      fetchSources(token),
      fetchClusters(token),
      fetchGraphNodes(token),
    ]).then(([srcResult, clsResult, nodesResult]) => {
      if (!mounted.current) return;

      if (srcResult.status === 'fulfilled')   setSources(srcResult.value);
      if (clsResult.status === 'fulfilled')   setClusters(clsResult.value);
      if (nodesResult.status === 'fulfilled') setGraphNodes(nodesResult.value);

      setIsLoading(false);
    });
  }, [token]);

  // ── Tool invocation ───────────────────────────────────────────────────────
  const invokeTool = useCallback(
    async (tool: ToolKey, context: string, sourceTitles: string[] = []) => {
      if (!token) return;

      setToolLoading((prev) => ({ ...prev, [tool]: true }));
      try {
        const result = await apiInvokeTool(tool, context, sourceTitles, token);
        if (mounted.current) {
          setToolResults((prev) => ({ ...prev, [tool]: result }));
        }
      } catch (err) {
        console.error(`[useResearchWorkspace] Tool "${tool}" failed:`, err);
      } finally {
        if (mounted.current) {
          setToolLoading((prev) => ({ ...prev, [tool]: false }));
        }
      }
    },
    [token]
  );

  return { sources, clusters, graphNodes, isLoading, toolLoading, toolResults, invokeTool };
}
