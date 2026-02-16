import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';

// Mock authService
vi.mock('@/services/auth', () => ({
    authService: {
        login: vi.fn(),
        getMe: vi.fn(),
        loginWithGithub: vi.fn(),
    },
}));

vi.mock('@/stores/authStore', () => ({
    useAuthStore: vi.fn(() => ({
        setAuth: vi.fn(),
        status: 'unauthenticated',
    })),
}));

import { authService } from '@/services/auth';

const getEmailInput = () => screen.getByLabelText('Email');
const getPasswordInput = () => screen.getByLabelText('Password') as HTMLInputElement;
const getSignInButton = () => screen.getByRole('button', { name: /sign in/i });

describe('LoginPage', () => {
    const user = userEvent.setup();

    beforeEach(() => vi.clearAllMocks());

    it('renders email and password fields', () => {
        render(<LoginPage />);
        expect(getEmailInput()).toBeInTheDocument();
        expect(getPasswordInput()).toBeInTheDocument();
        expect(getSignInButton()).toBeInTheDocument();
    });

    it('shows error on invalid credentials', async () => {
        (authService.login as any).mockRejectedValue(new Error('Incorrect email or password.'));
        render(<LoginPage />);

        await user.type(getEmailInput(), 'bad@test.com');
        await user.type(getPasswordInput(), 'wrongpass');
        await user.click(getSignInButton());

        await waitFor(() => {
            expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
        });
    });

    it('calls login + getMe on valid submit and redirects', async () => {
        const mockToken = { access_token: 'jwt-123', token_type: 'bearer' };
        const mockUser = { id: 1, email: 'user@test.com', role: 'user', is_active: true };
        (authService.login as any).mockResolvedValue(mockToken);
        (authService.getMe as any).mockResolvedValue(mockUser);

        render(<LoginPage />);
        await user.type(getEmailInput(), 'user@test.com');
        await user.type(getPasswordInput(), 'correct123');
        await user.click(getSignInButton());

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith('user@test.com', 'correct123');
            expect(authService.getMe).toHaveBeenCalledWith('jwt-123');
        });
    });

    it('disables inputs while loading', async () => {
        // Never-resolving promise to keep loading state
        (authService.login as any).mockReturnValue(new Promise(() => { }));
        render(<LoginPage />);

        await user.type(getEmailInput(), 'a@b.com');
        await user.type(getPasswordInput(), 'pass1234');
        await user.click(getSignInButton());

        await waitFor(() => {
            expect(getEmailInput()).toBeDisabled();
            expect(getPasswordInput()).toBeDisabled();
        });
    });

    it('toggles password visibility', async () => {
        render(<LoginPage />);
        const passwordInput = getPasswordInput();
        expect(passwordInput.type).toBe('password');

        await user.click(screen.getByLabelText('Show password'));
        expect(passwordInput.type).toBe('text');

        await user.click(screen.getByLabelText('Hide password'));
        expect(passwordInput.type).toBe('password');
    });

    it('has links to register and reset-password', () => {
        render(<LoginPage />);
        expect(screen.getByText(/create an account/i).closest('a')).toHaveAttribute('href', '/register');
        expect(screen.getByText(/forgot password/i).closest('a')).toHaveAttribute('href', '/reset-password');
    });
});
