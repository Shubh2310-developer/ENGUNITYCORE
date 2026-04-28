import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import WellbeingBanner from '@/components/analytics/WellbeingBanner';
import { wellbeingService } from '@/services/wellbeing';

vi.mock('@/services/wellbeing', () => ({
  wellbeingService: {
    checkWellbeing: vi.fn(),
    startPomodoro: vi.fn(),
    logWellbeingEvent: vi.fn(),
  },
}));

describe('WellbeingBanner', () => {
  let visibilityState: 'visible' | 'hidden' = 'visible';

  const cautionResponse = {
    signals_detected: ['frustration'],
    overall_status: 'caution',
    stress_score: 3,
    intervention: {
      type: 'cooldown',
      message: 'Take a short reset.',
      action: 'open_support_tips',
      duration: 5,
    },
    message: 'A reset may help.',
    tips: ['Change one variable at a time.'],
  } as const;

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    visibilityState = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState,
    });
    process.env.NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED = 'true';
    (wellbeingService.logWellbeingEvent as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    (wellbeingService.startPomodoro as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 'started',
      focus_minutes: 25,
      break_minutes: 5,
      topic: 'Analytics reset',
    });
  });

  it('does not render for healthy status', async () => {
    (wellbeingService.checkWellbeing as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      signals_detected: [],
      overall_status: 'healthy',
      stress_score: 0,
      intervention: null,
      message: 'Balanced rhythm',
      tips: [],
    });

    render(<WellbeingBanner activeTab="overview" datasetId="123" />);

    await waitFor(() => {
      expect(wellbeingService.checkWellbeing).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByText(/wellbeing support/i)).not.toBeInTheDocument();
  });

  it('renders caution state and logs dismissals', async () => {
    (wellbeingService.checkWellbeing as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(cautionResponse);

    render(<WellbeingBanner activeTab="overview" datasetId="123" />);

    expect(await screen.findByText(/take a short reset/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/dismiss wellbeing banner/i));

    await waitFor(() => {
      expect(wellbeingService.logWellbeingEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'dismissed' }));
    });
  });

  it('schedules 15-minute polling for caution status while visible', async () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    (wellbeingService.checkWellbeing as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(cautionResponse);

    render(<WellbeingBanner activeTab="overview" datasetId="123" />);
    await waitFor(() => {
      expect(wellbeingService.checkWellbeing).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 15 * 60 * 1000);
    });
  });

  it('does not poll while hidden and resumes when visible', async () => {
    visibilityState = 'hidden';
    (wellbeingService.checkWellbeing as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(cautionResponse);

    render(<WellbeingBanner activeTab="overview" datasetId="123" />);
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(wellbeingService.checkWellbeing).not.toHaveBeenCalled();

    visibilityState = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => {
      expect(wellbeingService.checkWellbeing).toHaveBeenCalledTimes(1);
    });
  });

  it('uses 60-minute interval on save-data networks', async () => {
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true, effectiveType: '4g' },
    });
    (wellbeingService.checkWellbeing as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(cautionResponse);

    render(<WellbeingBanner activeTab="overview" datasetId="123" />);
    await waitFor(() => {
      expect(wellbeingService.checkWellbeing).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000);
    });
  });

  it('respects widget feature flag and avoids requests when disabled', async () => {
    process.env.NEXT_PUBLIC_WELLBEING_WIDGET_ENABLED = 'false';
    (wellbeingService.checkWellbeing as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(cautionResponse);

    render(<WellbeingBanner activeTab="overview" datasetId="123" />);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(wellbeingService.checkWellbeing).not.toHaveBeenCalled();
    expect(screen.queryByText(/wellbeing support/i)).not.toBeInTheDocument();
  });

  it('logs viewed, action, and break-started events', async () => {
    (wellbeingService.checkWellbeing as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      signals_detected: ['marathon'],
      overall_status: 'concern',
      stress_score: 7,
      intervention: {
        type: 'break_reminder',
        message: 'Take a short reset.',
        action: 'start_break_timer',
        duration: 10,
      },
      message: 'A reset may help.',
      tips: ['Stand up for a minute.'],
    });

    render(<WellbeingBanner activeTab="overview" datasetId="123" />);
    await screen.findByText(/take a short reset/i);

    await waitFor(() => {
      expect(wellbeingService.logWellbeingEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'viewed' }));
    });

    fireEvent.click(await screen.findByRole('button', { name: /tips/i }));
    await waitFor(() => {
      expect(wellbeingService.logWellbeingEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'action_clicked' }));
    });

    fireEvent.click(screen.getByRole('button', { name: /start a short reset/i }));
    await waitFor(() => {
      expect(wellbeingService.logWellbeingEvent).toHaveBeenCalledWith(expect.objectContaining({ event_type: 'break_started' }));
    });

    await waitFor(() => {
      expect(wellbeingService.startPomodoro).toHaveBeenCalledWith(expect.objectContaining({ break_minutes: 10 }));
    });
  });
});
