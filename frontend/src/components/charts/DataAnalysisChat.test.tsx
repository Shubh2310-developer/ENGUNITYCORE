import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DataAnalysisChat from '@/components/charts/DataAnalysisChat';
import { analyticsService } from '@/services/analytics';

vi.mock('@/services/analytics', async () => {
  return {
    analyticsService: {
      askData: vi.fn(),
    },
  };
});

describe('DataAnalysisChat', () => {
  const onApplyResult = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits query, renders summary, and triggers apply callback', async () => {
    (analyticsService.askData as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      query: 'Show category averages',
      analysis_type: 'comparison',
      summary: 'Category B has higher average value.',
      insights: [
        {
          insight_type: 'trend',
          title: 'Top category',
          description: 'Category B leads the average.',
          confidence: 0.92,
          data_points: [],
        },
      ],
      chart: undefined,
      raw_data: [{ category: 'B', value: 30 }],
      suggested_queries: ['Break this down by week'],
      processing_time: 0.45,
    });

    render(<DataAnalysisChat datasetId={123} onApplyResult={onApplyResult} />);

    fireEvent.change(screen.getByPlaceholderText(/show which category/i), {
      target: { value: 'Show category averages for this dataset' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

    await waitFor(() => {
      expect(analyticsService.askData).toHaveBeenCalledTimes(1);
    });
    expect(onApplyResult).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText(/Category B has higher average value/i)).toBeInTheDocument();
  });

  it('supports follow-up query buttons', async () => {
    (analyticsService.askData as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        query: 'Show total by category',
        analysis_type: 'comparison',
        summary: 'Totals were computed.',
        insights: [],
        chart: undefined,
        raw_data: [],
        suggested_queries: ['Show top 10 by value'],
        processing_time: 0.33,
      })
      .mockResolvedValueOnce({
        query: 'Show top 10 by value',
        analysis_type: 'summary',
        summary: 'Top values listed.',
        insights: [],
        chart: undefined,
        raw_data: [],
        suggested_queries: [],
        processing_time: 0.3,
      });

    render(<DataAnalysisChat datasetId={123} onApplyResult={onApplyResult} />);

    fireEvent.change(screen.getByPlaceholderText(/show which category/i), {
      target: { value: 'Show total by category in this dataset' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Show top 10 by value' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show top 10 by value' }));

    await waitFor(() => {
      expect(analyticsService.askData).toHaveBeenCalledTimes(2);
    });
    expect(onApplyResult).toHaveBeenCalledTimes(2);
  });
});
