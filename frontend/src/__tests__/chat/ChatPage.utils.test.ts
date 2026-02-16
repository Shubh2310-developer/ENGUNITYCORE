/**
 * ChatPage.utils.test.ts
 *
 * Tests for the utility / helper functions used inside ChatPage.
 * Because these functions are defined inside the component closure,
 * we re-implement them here (they are pure) and verify behaviour.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// -------------------------------------------------------
// Re-implement the three pure helpers from page.tsx
// They live inside the component, so we extract them for
// isolated testing. If the component is later refactored to
// export them, swap these implementations for the imports.
// -------------------------------------------------------

/** Mirrors page.tsx `shouldShowDivider` */
function shouldShowDivider(
    index: number,
    messages: Array<{ timestamp?: string }>
): boolean {
    if (index === 0) return false;
    const currentMsg = messages[index];
    const prevMsg = messages[index - 1];
    if (!currentMsg?.timestamp || !prevMsg?.timestamp) return false;
    const currentDate = new Date(currentMsg.timestamp).toDateString();
    const prevDate = new Date(prevMsg.timestamp).toDateString();
    return currentDate !== prevDate;
}

/** Mirrors page.tsx `getDividerText` */
function getDividerText(timestamp?: string): string {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** Mirrors page.tsx `formatTimestamp` */
function formatTimestamp(ts: string | undefined, now: Date): string {
    if (!ts) return '';
    const date = new Date(ts);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
}

// -------------------------------------------------------
// Tests
// -------------------------------------------------------

describe('shouldShowDivider', () => {
    it('returns false for the first message (index=0)', () => {
        const msgs = [{ timestamp: '2026-01-15T10:00:00Z' }];
        expect(shouldShowDivider(0, msgs)).toBe(false);
    });

    it('returns false when both messages are on the same day', () => {
        const msgs = [
            { timestamp: '2026-01-15T08:00:00Z' },
            { timestamp: '2026-01-15T14:00:00Z' },
        ];
        expect(shouldShowDivider(1, msgs)).toBe(false);
    });

    it('returns true when messages span different days', () => {
        const msgs = [
            { timestamp: '2026-01-14T12:00:00Z' },
            { timestamp: '2026-01-16T12:00:00Z' },
        ];
        expect(shouldShowDivider(1, msgs)).toBe(true);
    });

    it('returns false when timestamps are missing', () => {
        const msgs = [{ timestamp: undefined }, { timestamp: undefined }];
        expect(shouldShowDivider(1, msgs)).toBe(false);
    });

    it('returns false when previous timestamp is missing', () => {
        const msgs = [
            { timestamp: undefined },
            { timestamp: '2026-01-15T10:00:00Z' },
        ];
        expect(shouldShowDivider(1, msgs)).toBe(false);
    });
});

describe('getDividerText', () => {
    it('returns "Today" for today\'s date', () => {
        const today = new Date();
        expect(getDividerText(today.toISOString())).toBe('Today');
    });

    it('returns "Yesterday" for yesterday\'s date', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(getDividerText(yesterday.toISOString())).toBe('Yesterday');
    });

    it('returns formatted date for older dates', () => {
        const old = new Date('2025-06-15T12:00:00Z');
        const result = getDividerText(old.toISOString());
        // Should contain the day name and month
        expect(result).toContain('June');
        expect(result).toContain('15');
    });

    it('returns "Unknown" when no timestamp provided', () => {
        expect(getDividerText(undefined)).toBe('Unknown');
    });
});

describe('formatTimestamp', () => {
    const now = new Date('2026-02-12T12:00:00Z');

    it('returns "Just now" for less than a minute ago', () => {
        const ts = new Date('2026-02-12T11:59:30Z').toISOString();
        expect(formatTimestamp(ts, now)).toBe('Just now');
    });

    it('returns minutes ago for less than an hour', () => {
        const ts = new Date('2026-02-12T11:45:00Z').toISOString();
        expect(formatTimestamp(ts, now)).toBe('15m ago');
    });

    it('returns hours ago for less than a day', () => {
        const ts = new Date('2026-02-12T09:00:00Z').toISOString();
        expect(formatTimestamp(ts, now)).toBe('3h ago');
    });

    it('returns date string for more than a day ago', () => {
        const ts = new Date('2026-02-10T09:00:00Z').toISOString();
        const result = formatTimestamp(ts, now);
        // Should be a locale date string, not relative
        expect(result).not.toContain('ago');
        expect(result).toBeTruthy();
    });

    it('returns empty string for undefined timestamp', () => {
        expect(formatTimestamp(undefined, now)).toBe('');
    });
});
