import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PomodoroInlineTimer from '@/components/analytics/PomodoroInlineTimer';

describe('PomodoroInlineTimer', () => {
  it('renders focus timer and supports pause/resume/reset controls', () => {
    render(<PomodoroInlineTimer focusMinutes={1} breakMinutes={1} onCompleted={vi.fn()} />);

    expect(screen.getByText(/focus timer/i)).toBeInTheDocument();
    expect(screen.getByText('01:00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByText('01:00')).toBeInTheDocument();
  });
});
