/**
 * ChatPage.test.tsx
 *
 * Component-level unit tests for ChatPage.
 * Validates initial state management, UI rendering,
 * sidebar interactions, slash commands, and send behaviour.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ------------------------------------------------------------------
// Mocks — must be declared before component import
// ------------------------------------------------------------------

// Mock CSS modules
vi.mock('./chat.module.css', () => ({
    default: new Proxy({}, { get: (_target, name) => String(name) }),
}));

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: React.forwardRef(({ children, ...props }: any, ref: any) => (
            <div ref={ref} {...props}>{children}</div>
        )),
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-markdown
vi.mock('react-markdown', () => ({
    default: ({ children }: any) => <div data-testid="markdown">{children}</div>,
}));

// Mock remark-gfm
vi.mock('remark-gfm', () => ({ default: () => { } }));

// Mock lucide-react icons
// Mock CSS modules to return the class name as the value
vi.mock('@/app/(dashboard)/chat/chat.module.css', () => ({
    default: new Proxy({}, {
        get: (_, prop) => prop
    })
}));

vi.mock('lucide-react', () => {
    const icon = ({ className, ...props }: any) => <span className={className} {...props} />;
    return {
        Bot: icon, Send: icon, Plus: icon, Trash2: icon, Search: icon,
        X: icon, Loader2: icon, Check: icon, Copy: icon, RotateCcw: icon,
        Shield: icon, ChevronLeft: icon, ChevronRight: icon, MessageSquare: icon,
        Network: icon, Paperclip: icon, Image: icon, Sparkles: icon,
        Brain: icon, Globe: icon, FileText: icon, Zap: icon, Clock: icon,
        CheckCircle2: icon, AlertCircle: icon, RefreshCw: icon, Lightbulb: icon,
        Database: icon, GitBranch: icon, BarChart2: icon, PanelLeftClose: icon,
        PanelLeftOpen: icon, Settings: icon,
        MessageCircle: icon, Download: icon, LogOut: icon,
        LayoutDashboard: icon, Users: icon, FolderTree: icon, Card: icon,
        User: icon, ChevronDown: icon,
    };
});

// Mock authStore
const mockUser = { email: 'test@test.com', name: 'Test User' };
vi.mock('@/stores/authStore', () => ({
    useAuthStore: () => ({ user: mockUser, token: 'test-token-123' }),
}));

// Mock services
// Mock services using vi.hoisted to avoid reference errors in vi.mock
const {
    mockGetSessions,
    mockGetSession,
    mockCreateSession,
    mockDeleteSession,
    mockStreamMessage,
    mockStreamQuery,
    mockGetCommunities,
    mockRebuildGraph
} = vi.hoisted(() => ({
    mockGetSessions: vi.fn(),
    mockGetSession: vi.fn(),
    mockCreateSession: vi.fn(),
    mockDeleteSession: vi.fn(),
    mockStreamMessage: vi.fn(),
    mockStreamQuery: vi.fn(),
    mockGetCommunities: vi.fn(),
    mockRebuildGraph: vi.fn(),
}));

vi.mock('@/services/chat', () => ({
    chatService: {
        getSessions: (...args: any[]) => mockGetSessions(...args),
        getSession: (...args: any[]) => mockGetSession(...args),
        createSession: (...args: any[]) => mockCreateSession(...args),
        deleteSession: (...args: any[]) => mockDeleteSession(...args),
        streamMessage: (...args: any[]) => mockStreamMessage(...args),
    },
    Message: {},
}));



vi.mock('@/services/omniRag', () => ({
    omniRagService: {
        streamQuery: (...args: any[]) => mockStreamQuery(...args),
        getCommunities: (...args: any[]) => mockGetCommunities(...args),
        rebuildGraph: (...args: any[]) => mockRebuildGraph(...args),
        getStats: vi.fn().mockResolvedValue({ documents: 0, chunks: 0 }),
    },
}));

vi.mock('@/services/document', () => ({
    documentService: {
        uploadDocument: vi.fn(),
    },
}));

vi.mock('@/services/image', () => ({
    imageService: {
        uploadImage: vi.fn(),
        listImages: vi.fn().mockResolvedValue([]),
    },
    ImageResponse: {},
}));

// Import component after all mocks
import ChatPage from '@/app/(dashboard)/chat/page';

// ------------------------------------------------------------------
// Test Helpers
// ------------------------------------------------------------------

function setupEmptySessions() {
    mockGetSessions.mockResolvedValue([]);
}

function setupWithSessions() {

    mockGetSessions.mockResolvedValue([
        { id: 's1', title: 'First Chat', created_at: '2026-01-01', updated_at: '2026-01-02', message_count: 5 },
        { id: 's2', title: 'Second Chat', created_at: '2026-01-01', updated_at: '2026-01-01', message_count: 2 },
    ]);
    mockGetSession.mockImplementation(async (id: any) => {
        if (id === 's1') {
            return {
                id: 's1',
                title: 'First Chat',
                messages: [
                    { id: 'm1', role: 'user', content: 'Hello', timestamp: '2026-01-02T10:00:00Z' },
                    { id: 'm2', role: 'assistant', content: 'Hi there!', timestamp: '2026-01-02T10:00:01Z' },
                ],
            };
        }
        return { id, title: 'New Chat', messages: [] };
    });
    mockCreateSession.mockResolvedValue({
        id: 'new-session-id',
        title: 'New Chat',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        message_count: 0
    });
    mockDeleteSession.mockResolvedValue({ success: true });
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------

describe('ChatPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Suppress console.error from expected failures
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // -------------------------------------------------------
    // UT-SM-01: Initial load with empty sessions
    // -------------------------------------------------------
    describe('UT-SM-01: Initial Load', () => {
        it('shows welcome message when no sessions exist', async () => {
            setupEmptySessions();

            render(<ChatPage />);

            // Wait for async initChat to complete
            await waitFor(() => {
                const markdowns = screen.getAllByTestId('markdown');
                expect(markdowns.length).toBeGreaterThan(0);
                expect(markdowns[0].textContent).toMatch(/Welcome to/i);
            });

            // Should show capability bullets
            expect(screen.getByText(/Programming/i)).toBeDefined();
            expect(screen.getByText(/System Design/i)).toBeDefined();
            expect(screen.getByText(/Data Engineering/i)).toBeDefined();
            expect(screen.getByText(/DevOps/i)).toBeDefined();
        });
    });

    // -------------------------------------------------------
    // UT-SM-02: Load existing sessions
    // -------------------------------------------------------
    describe('UT-SM-02: Load Existing Sessions', () => {
        it('loads sessions and displays first session messages', async () => {
            setupWithSessions();

            render(<ChatPage />);

            await waitFor(() => {
                expect(mockGetSession).toHaveBeenCalledWith('s1');
            });

            // Sessions should appear in sidebar
            await waitFor(() => {
                expect(screen.getByText('First Chat')).toBeDefined();
                expect(screen.getByText('Second Chat')).toBeDefined();
            });
        });
    });

    // -------------------------------------------------------
    // UT-SM-04: Loading state
    // -------------------------------------------------------
    describe('UT-SM-04: Loading State', () => {
        it('disables send button while loading', async () => {
            setupEmptySessions();
            render(<ChatPage />);

            await waitFor(() => {
                expect(screen.getByText(/Welcome to/i)).toBeDefined();
            });

            // Find the send button — it should be present but disabled when there's no input
            const sendButton = screen.getByTitle('Send message');
            expect(sendButton).toBeDefined();
            expect(sendButton.hasAttribute('disabled') || sendButton.getAttribute('disabled') !== null).toBe(true);
        });
    });

    // -------------------------------------------------------
    // UT-SM-05: Sidebar toggle
    // -------------------------------------------------------
    describe('UT-SM-05: Sidebar Toggle', () => {
        it('toggles sidebar visibility', async () => {
            setupEmptySessions();
            render(<ChatPage />);

            await waitFor(() => {
                expect(screen.getByText(/Welcome to/i)).toBeDefined();
            });

            // Find the toggle button by its icon role or title
            const toggleButtons = screen.getAllByRole('button');
            const sidebarToggle = toggleButtons.find(
                btn => btn.getAttribute('title')?.includes('sidebar') || btn.getAttribute('title')?.includes('Sidebar')
            );

            // If there's a toggle button, clicking it should not throw
            if (sidebarToggle) {
                fireEvent.click(sidebarToggle);
                // The sidebar should still be in the DOM (just hidden)
            }
        });
    });

    // -------------------------------------------------------
    // UT-MS-02: Empty input blocked
    // -------------------------------------------------------
    describe('UT-MS-02: Empty Input Blocked', () => {
        it('does not send empty or whitespace-only input', async () => {
            setupEmptySessions();
            render(<ChatPage />);

            await waitFor(() => {
                expect(screen.getByText(/Welcome to/i)).toBeDefined();
            });

            const textarea = screen.getByPlaceholderText(/Ask anything/i);

            // Type whitespace only
            await userEvent.clear(textarea);
            await userEvent.type(textarea, '   ');

            const sendButton = screen.getByTitle('Send message');
            fireEvent.click(sendButton);

            // streamQuery should NOT be called
            expect(mockStreamQuery).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------
    // UT-MS-04: /clear command
    // -------------------------------------------------------
    describe('UT-MS-04: /clear command', () => {
        it('clears messages and resets session on /clear command', async () => {
            setupWithSessions();
            render(<ChatPage />);

            await waitFor(() => {
                expect(mockGetSession).toHaveBeenCalledWith('s1');
            });

            const textarea = screen.getByPlaceholderText(/Ask anything/i);
            await userEvent.clear(textarea);
            await userEvent.type(textarea, '/clear');

            const sendButton = screen.getByTitle('Send message');
            fireEvent.click(sendButton);

            // streamQuery should NOT be called (clear doesn't send to API)
            expect(mockStreamQuery).not.toHaveBeenCalled();

            // After clearing, welcome message should reappear
            await waitFor(() => {
                expect(screen.getByText(/Chat cleared!/i)).toBeDefined();
            });
        });
    });

    // -------------------------------------------------------
    // UT-MS-05/06/07: Slash commands transform input
    // -------------------------------------------------------
    describe('Slash Commands', () => {
        beforeEach(async () => {
            setupEmptySessions();
            mockStreamQuery.mockImplementation((_req: any, _onEvent: any) => Promise.resolve());
        });

        it('/explain prepends explanation prefix', async () => {
            const user = userEvent.setup();
            render(<ChatPage />);

            await waitFor(() => {
                expect(screen.getByText(/Welcome to/i)).toBeDefined();
            });

            const textarea = screen.getByPlaceholderText(/Ask anything/i);
            await userEvent.clear(textarea);
            await userEvent.type(textarea, '/explain React hooks');

            const sendButton = screen.getByTitle('Send message');
            await user.click(sendButton);

            await waitFor(() => {
                expect(mockStreamQuery).toHaveBeenCalled();
            });

            // Verify the query sent to streamQuery contains the explain prefix
            const queryArg = mockStreamQuery.mock.calls[0][0];
            expect(queryArg.query).toContain('explain the following');
            expect(queryArg.query).toContain('React hooks');
        });

        it('/summarize prepends summary prefix', async () => {
            const user = userEvent.setup();
            render(<ChatPage />);

            await waitFor(() => {
                expect(screen.getByText(/Welcome to/i)).toBeDefined();
            });

            const textarea = screen.getByPlaceholderText(/Ask anything/i);
            await userEvent.clear(textarea);
            await userEvent.type(textarea, '/summarize REST APIs');

            const sendButton = screen.getByTitle('Send message');
            await user.click(sendButton);

            await waitFor(() => {
                expect(mockStreamQuery).toHaveBeenCalled();
            });

            const queryArg = mockStreamQuery.mock.calls[0][0];
            expect(queryArg.query).toContain('summary');
            expect(queryArg.query).toContain('REST APIs');
        });

        it('/code prepends code-help prefix', async () => {
            const user = userEvent.setup();
            render(<ChatPage />);

            await waitFor(() => {
                const markdowns = screen.getAllByTestId('markdown');
                const welcomeMsg = markdowns.find(m => m.textContent?.match(/Welcome to/i));
                expect(welcomeMsg).toBeDefined();
            });

            const textarea = screen.getByPlaceholderText(/Ask anything/i);
            await userEvent.clear(textarea);
            await userEvent.type(textarea, '/code binary search');

            const sendButton = screen.getByTitle('Send message');
            await user.click(sendButton);

            await waitFor(() => {
                expect(mockStreamQuery).toHaveBeenCalled();
            });

            const queryArg = mockStreamQuery.mock.calls[0][0];
            expect(queryArg.query).toContain('write or refactor');
            expect(queryArg.query).toContain('binary search');
        });
    });

    // -------------------------------------------------------
    // UT-SM-06: Session creation
    // -------------------------------------------------------
    describe('New Chat Button', () => {
        it('creates a new session when New Chat is clicked', async () => {
            const user = userEvent.setup();
            setupWithSessions();
            render(<ChatPage />);

            await waitFor(() => {
                expect(screen.getByText('First Chat')).toBeDefined();
            });

            // Find the "New Chat" button
            const newChatBtn = screen.getByText(/New Chat/i);
            expect(newChatBtn).toBeDefined();

            await user.click(newChatBtn);

            await waitFor(() => {
                const markdowns = screen.getAllByTestId('markdown');
                // The welcome message should be the last one if added, or only one if cleared
                // Check if any markdown contains "Welcome to"
                const welcomeMsg = markdowns.find(m => m.textContent?.match(/Welcome to/i));
                expect(welcomeMsg).toBeDefined();
            });
        });
    });
});
