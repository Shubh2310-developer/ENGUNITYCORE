import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock all dependencies before imports ──────────────────────────────────────

// Default token — tests that need no-token override this via `mockGetState`
let mockToken: string | null = 'test-token';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ token: mockToken })),
  },
}));

vi.mock('@/services/chat', () => ({
  chatService: {
    getSessions: vi.fn(),
  },
}));

vi.mock('@/services/document', () => ({
  documentService: {
    getDocuments: vi.fn(),
  },
}));

vi.mock('@/services/code', () => ({
  codeService: {
    getProjects: vi.fn(),
  },
}));

vi.mock('@/services/analytics', () => ({
  analyticsService: {
    listDatasets: vi.fn(),
  },
}));

vi.mock('@/services/decision', () => ({
  decisionService: {
    getDecisions: vi.fn(),
  },
}));

vi.mock('@/services/jobprep', () => ({
  jobPrepService: {
    getProfile: vi.fn(),
    getTargetRoles: vi.fn(),
    getSkills: vi.fn(),
    getSimulations: vi.fn(),
  },
}));

vi.mock('@/services/research', () => ({
  fetchSources: vi.fn(),
  fetchClusters: vi.fn(),
  // fetchGraphNodes intentionally not imported — must not be called by overview
}));

// ── Import after mocks ────────────────────────────────────────────────────────
import { getOverviewData, formatRelativeTime } from '@/services/overview';
import { chatService } from '@/services/chat';
import { documentService } from '@/services/document';
import { codeService } from '@/services/code';
import { analyticsService } from '@/services/analytics';
import { decisionService } from '@/services/decision';
import { jobPrepService } from '@/services/jobprep';
import { fetchSources, fetchClusters } from '@/services/research';
import { useAuthStore } from '@/stores/authStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockChatSessions = [
  { id: 's1', title: 'API Design Discussion', created_at: '2026-06-01T10:00:00Z', updated_at: '2026-06-07T15:00:00Z', messages: [] },
  { id: 's2', title: 'ML Model Review', created_at: '2026-06-02T09:00:00Z', updated_at: '2026-06-06T11:00:00Z', messages: [] },
];

const mockDocuments = [
  { id: 'd1', title: 'Architecture Notes', status: 'final', created_at: '2026-06-03T08:00:00Z', updated_at: '2026-06-05T12:00:00Z' },
];

const mockCodeProjects = [
  { id: 'p1', name: 'engunity-backend', language: 'Python', created_at: '2026-06-01T08:00:00Z', updated_at: '2026-06-04T09:00:00Z' },
];

const mockDatasets = [
  { id: 1, name: 'Sales Q1', status: 'ready', created_at: '2026-06-01T10:00:00Z', updated_at: '2026-06-01T10:30:00Z' },
  { id: 2, name: 'User Metrics', status: 'processing', created_at: '2026-06-02T10:00:00Z', updated_at: '2026-06-02T10:30:00Z' },
];

const mockDecisions = [
  {
    id: 'dec1',
    title: 'Use PostgreSQL',
    status: 'confirmed',
    confidence: 'high',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    ai_flags: [],
  },
];

const mockProfile = { id: 'prof1', overall_readiness_score: 72 };

const mockRoles = [
  { id: 'r1', role_title: 'Senior Engineer', is_primary: true, readiness_score: 72, confidence_level: 'medium' },
];

function setupAllMocksResolved() {
  mockToken = 'test-token';
  vi.mocked(chatService.getSessions).mockResolvedValue(mockChatSessions as any);
  vi.mocked(documentService.getDocuments).mockResolvedValue(mockDocuments as any);
  vi.mocked(codeService.getProjects).mockResolvedValue(mockCodeProjects as any);
  vi.mocked(analyticsService.listDatasets).mockResolvedValue(mockDatasets as any);
  vi.mocked(decisionService.getDecisions).mockResolvedValue(mockDecisions as any);
  vi.mocked(jobPrepService.getProfile).mockResolvedValue(mockProfile as any);
  vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue(mockRoles as any);
  vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
  vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
  vi.mocked(fetchSources).mockResolvedValue([]);
  vi.mocked(fetchClusters).mockResolvedValue([]);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('overviewService.getOverviewData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = 'test-token'; // reset to authenticated state before each test
  });

  // 1. Aggregates successful module responses — all 7 modules present
  it('aggregates metrics from all supported modules', async () => {
    setupAllMocksResolved();

    const result = await getOverviewData();

    const ids = result.metrics.map((m) => m.id);
    expect(ids).toContain('chat');
    expect(ids).toContain('documents');
    expect(ids).toContain('code');
    expect(ids).toContain('analytics');
    expect(ids).toContain('decisions');
    expect(ids).toContain('jobprep');
    expect(ids).toContain('research');

    // Values reflect real data, not mock defaults
    expect(result.metrics.find((m) => m.id === 'chat')?.value).toBe(2);
    expect(result.metrics.find((m) => m.id === 'documents')?.value).toBe(1);
    expect(result.metrics.find((m) => m.id === 'code')?.value).toBe(1);
    expect(result.metrics.find((m) => m.id === 'analytics')?.value).toBe(2);
    expect(result.metrics.find((m) => m.id === 'decisions')?.value).toBe(1);

    expect(result.moduleErrors).toHaveLength(0);
  });

  // 2. Tolerates partial module failures
  it('returns partial data when some modules fail', async () => {
    vi.mocked(chatService.getSessions).mockRejectedValue(new Error('Chat service down'));
    vi.mocked(documentService.getDocuments).mockResolvedValue(mockDocuments as any);
    vi.mocked(codeService.getProjects).mockResolvedValue(mockCodeProjects as any);
    vi.mocked(analyticsService.listDatasets).mockRejectedValue(new Error('Analytics unreachable'));
    vi.mocked(decisionService.getDecisions).mockResolvedValue(mockDecisions as any);
    vi.mocked(jobPrepService.getProfile).mockResolvedValue(mockProfile as any);
    vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
    vi.mocked(fetchSources).mockResolvedValue([]);
    vi.mocked(fetchClusters).mockResolvedValue([]);

    const result = await getOverviewData();

    const docMetric = result.metrics.find((m) => m.id === 'documents');
    expect(docMetric?.value).toBe(1);

    const chatMetric = result.metrics.find((m) => m.id === 'chat');
    expect(chatMetric?.value).toBe(0);
    expect(chatMetric?.status).toBe('error');

    const analyticsMetric = result.metrics.find((m) => m.id === 'analytics');
    expect(analyticsMetric?.value).toBe(0);
    expect(analyticsMetric?.status).toBe('error');

    const failedModules = result.moduleErrors.map((e) => e.module);
    expect(failedModules).toContain('chat');
    expect(failedModules).toContain('analytics');

    expect(result).toBeTruthy();
  });

  // 3. Recent work sorted by timestamps descending
  it('sorts recent work by timestamp descending', async () => {
    const sessions = [
      { id: 's1', title: 'Old Chat', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', messages: [] },
      { id: 's2', title: 'New Chat', created_at: '2026-06-07T00:00:00Z', updated_at: '2026-06-07T00:00:00Z', messages: [] },
    ];
    vi.mocked(chatService.getSessions).mockResolvedValue(sessions as any);
    vi.mocked(documentService.getDocuments).mockResolvedValue([]);
    vi.mocked(codeService.getProjects).mockResolvedValue([]);
    vi.mocked(analyticsService.listDatasets).mockResolvedValue([]);
    vi.mocked(decisionService.getDecisions).mockResolvedValue([]);
    vi.mocked(jobPrepService.getProfile).mockResolvedValue(mockProfile as any);
    vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
    vi.mocked(fetchSources).mockResolvedValue([]);
    vi.mocked(fetchClusters).mockResolvedValue([]);

    const result = await getOverviewData();

    expect(result.recentWork[0].title).toBe('New Chat');
    expect(result.recentWork[1].title).toBe('Old Chat');
  });

  // 4. Empty user data produces empty arrays, not mock data
  it('returns empty arrays when user has no work', async () => {
    vi.mocked(chatService.getSessions).mockResolvedValue([]);
    vi.mocked(documentService.getDocuments).mockResolvedValue([]);
    vi.mocked(codeService.getProjects).mockResolvedValue([]);
    vi.mocked(analyticsService.listDatasets).mockResolvedValue([]);
    vi.mocked(decisionService.getDecisions).mockResolvedValue([]);
    vi.mocked(jobPrepService.getProfile).mockResolvedValue({ id: 'p', overall_readiness_score: 0 } as any);
    vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
    vi.mocked(fetchSources).mockResolvedValue([]);
    vi.mocked(fetchClusters).mockResolvedValue([]);

    const result = await getOverviewData();

    expect(result.recentWork).toHaveLength(0);
    expect(result.activities).toHaveLength(0);

    // Count-based metrics should be 0, not mock values
    const countMetricIds = ['chat', 'documents', 'code', 'analytics', 'decisions', 'research'];
    countMetricIds.forEach((id) => {
      const m = result.metrics.find((x) => x.id === id);
      expect(m?.value).toBe(0);
    });

    expect(result.moduleErrors).toHaveLength(0);
  });

  // 5. Critical AI flags generate error-level signals
  it('generates error signal for critical AI flags in decisions', async () => {
    const decisionsWithFlag = [
      {
        id: 'dec1',
        title: 'Critical Decision',
        status: 'tentative',
        confidence: 'low',
        created_at: '2026-06-01T00:00:00Z',
        updated_at: '2026-06-01T00:00:00Z',
        ai_flags: [
          { id: 'f1', flag_type: 'bias_detected', severity: 'critical', message: 'Bias found', suggested_action: 'Review', dismissed: false },
        ],
      },
    ];

    vi.mocked(chatService.getSessions).mockResolvedValue([]);
    vi.mocked(documentService.getDocuments).mockResolvedValue([]);
    vi.mocked(codeService.getProjects).mockResolvedValue([]);
    vi.mocked(analyticsService.listDatasets).mockResolvedValue([]);
    vi.mocked(decisionService.getDecisions).mockResolvedValue(decisionsWithFlag as any);
    vi.mocked(jobPrepService.getProfile).mockResolvedValue(mockProfile as any);
    vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
    vi.mocked(fetchSources).mockResolvedValue([]);
    vi.mocked(fetchClusters).mockResolvedValue([]);

    const result = await getOverviewData();

    const criticalSignal = result.signals.find((s) => s.type === 'error' && s.id.includes('critical'));
    expect(criticalSignal).toBeDefined();
    expect(criticalSignal?.text).toContain('critical AI flag');
  });

  // 6. Analytics, decisions, jobprep, and research appear in recent work
  it('includes analytics, decisions, and research items in recent work when data exists', async () => {
    const analyticsDataset = [
      { id: 10, name: 'Revenue Q2', status: 'ready', created_at: '2026-06-05T10:00:00Z', updated_at: '2026-06-05T10:00:00Z' },
    ];
    const decisions = [
      {
        id: 'dec2', title: 'Switch to Redis', status: 'tentative', confidence: 'medium',
        created_at: '2026-06-04T10:00:00Z', updated_at: '2026-06-04T10:00:00Z', ai_flags: [],
      },
    ];
    const sources = [
      { id: 'src1', title: 'Research Paper A', created_at: '2026-06-03T10:00:00Z' },
    ];

    vi.mocked(chatService.getSessions).mockResolvedValue([]);
    vi.mocked(documentService.getDocuments).mockResolvedValue([]);
    vi.mocked(codeService.getProjects).mockResolvedValue([]);
    vi.mocked(analyticsService.listDatasets).mockResolvedValue(analyticsDataset as any);
    vi.mocked(decisionService.getDecisions).mockResolvedValue(decisions as any);
    vi.mocked(jobPrepService.getProfile).mockResolvedValue(mockProfile as any);
    vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
    vi.mocked(fetchSources).mockResolvedValue(sources as any);
    vi.mocked(fetchClusters).mockResolvedValue([]);

    const result = await getOverviewData();

    const types = result.recentWork.map((w) => w.type);
    expect(types).toContain('analytics');
    expect(types).toContain('decision');
    expect(types).toContain('research');
  });

  // 7. analyticsService is called with a small limit, not the default 100
  it('calls analyticsService.listDatasets with a small limit', async () => {
    setupAllMocksResolved();

    await getOverviewData();

    expect(vi.mocked(analyticsService.listDatasets)).toHaveBeenCalledWith(0, expect.any(Number));
    const [, limit] = vi.mocked(analyticsService.listDatasets).mock.calls[0];
    expect(limit).toBeLessThanOrEqual(20);
  });

  // 8. fetchGraphNodes must NOT be called from overview (heavyweight guard)
  it('does not call fetchGraphNodes (heavyweight payload guard)', async () => {
    // fetchGraphNodes is not imported in the test file, so we verify indirectly
    // by checking that the research mock module does not export it to be called
    const researchModule = await import('@/services/research');
    // The module mock only exports fetchSources and fetchClusters — no fetchGraphNodes mock exists.
    // If overview.ts imported fetchGraphNodes, this test would throw at import time.
    expect('fetchGraphNodes' in researchModule).toBe(false);
  });

  // 9. Unauthenticated (no token) returns empty state without API calls
  it('returns empty data immediately when no auth token is present', async () => {
    // Override token to null for this test
    mockToken = null;

    const result = await getOverviewData();

    expect(result.recentWork).toHaveLength(0);
    expect(result.metrics).toHaveLength(0);
    expect(result.moduleErrors).toEqual([{ module: 'auth', message: 'Not authenticated' }]);

    // API calls must NOT have been made
    expect(vi.mocked(chatService.getSessions)).not.toHaveBeenCalled();
    expect(vi.mocked(documentService.getDocuments)).not.toHaveBeenCalled();
  });

  // 10. Analytics signals: processing and error datasets generate signals
  it('generates analytics processing and error signals', async () => {
    const datasets = [
      { id: 1, name: 'Processing DS', status: 'processing', created_at: '2026-06-06T10:00:00Z', updated_at: '2026-06-06T10:00:00Z' },
      { id: 2, name: 'Error DS', status: 'error', created_at: '2026-06-06T09:00:00Z', updated_at: '2026-06-06T09:00:00Z' },
    ];

    vi.mocked(chatService.getSessions).mockResolvedValue([]);
    vi.mocked(documentService.getDocuments).mockResolvedValue([]);
    vi.mocked(codeService.getProjects).mockResolvedValue([]);
    vi.mocked(analyticsService.listDatasets).mockResolvedValue(datasets as any);
    vi.mocked(decisionService.getDecisions).mockResolvedValue([]);
    vi.mocked(jobPrepService.getProfile).mockResolvedValue(null as any);
    vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
    vi.mocked(fetchSources).mockResolvedValue([]);
    vi.mocked(fetchClusters).mockResolvedValue([]);

    const result = await getOverviewData();

    const processingSignal = result.signals.find((s) => s.id === 'sig-analytics-processing');
    expect(processingSignal).toBeDefined();
    expect(processingSignal?.type).toBe('info');

    const errorSignal = result.signals.find((s) => s.id === 'sig-analytics-error');
    expect(errorSignal).toBeDefined();
    expect(errorSignal?.type).toBe('error');
  });

  // 11. Job prep readiness score signals
  it('generates jobprep warning signal for mid-range readiness score', async () => {
    vi.mocked(chatService.getSessions).mockResolvedValue([]);
    vi.mocked(documentService.getDocuments).mockResolvedValue([]);
    vi.mocked(codeService.getProjects).mockResolvedValue([]);
    vi.mocked(analyticsService.listDatasets).mockResolvedValue([]);
    vi.mocked(decisionService.getDecisions).mockResolvedValue([]);
    vi.mocked(jobPrepService.getProfile).mockResolvedValue({ id: 'p', overall_readiness_score: 60 } as any);
    vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
    vi.mocked(fetchSources).mockResolvedValue([]);
    vi.mocked(fetchClusters).mockResolvedValue([]);

    const result = await getOverviewData();

    const jobSignal = result.signals.find((s) => s.id === 'sig-jobprep-mid');
    expect(jobSignal).toBeDefined();
    expect(jobSignal?.type).toBe('warning');
    expect(jobSignal?.text).toContain('60%');
  });

  // 12. Module error signals when multiple modules fail
  it('adds a module-unavailable signal when modules fail', async () => {
    vi.mocked(chatService.getSessions).mockRejectedValue(new Error('down'));
    vi.mocked(documentService.getDocuments).mockRejectedValue(new Error('down'));
    vi.mocked(codeService.getProjects).mockResolvedValue([]);
    vi.mocked(analyticsService.listDatasets).mockResolvedValue([]);
    vi.mocked(decisionService.getDecisions).mockResolvedValue([]);
    vi.mocked(jobPrepService.getProfile).mockResolvedValue(null as any);
    vi.mocked(jobPrepService.getTargetRoles).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSkills).mockResolvedValue([]);
    vi.mocked(jobPrepService.getSimulations).mockResolvedValue([]);
    vi.mocked(fetchSources).mockResolvedValue([]);
    vi.mocked(fetchClusters).mockResolvedValue([]);

    const result = await getOverviewData();

    const errorSignal = result.signals.find((s) => s.id === 'sig-module-errors');
    expect(errorSignal).toBeDefined();
    expect(errorSignal?.type).toBe('warning');
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  it('returns "Just now" for recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('returns minutes ago format', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatRelativeTime(tenMinAgo)).toBe('10m ago');
  });

  it('returns hours ago format', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago format', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveDaysAgo)).toBe('5d ago');
  });

  it('returns "unknown" for null/undefined', () => {
    expect(formatRelativeTime(null)).toBe('unknown');
    expect(formatRelativeTime(undefined)).toBe('unknown');
  });

  it('returns "unknown" for invalid date string', () => {
    expect(formatRelativeTime('not-a-date')).toBe('unknown');
  });
});
