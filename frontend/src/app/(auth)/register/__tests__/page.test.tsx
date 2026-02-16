import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../page';

vi.mock('@/services/auth', () => ({
    authService: { register: vi.fn() },
}));
vi.mock('@/stores/authStore', () => ({
    useAuthStore: vi.fn(() => ({ status: 'unauthenticated' })),
}));

import { authService } from '@/services/auth';

describe('RegisterPage', () => {
    const user = userEvent.setup();
    beforeEach(() => vi.clearAllMocks());

    it('renders all registration fields', () => {
        render(<RegisterPage />);
        expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('name@nexus.com')).toBeInTheDocument();
    });

    it('requires terms checkbox before submit', async () => {
        render(<RegisterPage />);
        const submitBtn = screen.getByRole('button', { name: /initialize account/i });
        // HTML5 required attribute on checkbox prevents form submit
        expect(screen.getByRole('checkbox')).toBeRequired();
    });

    it('shows success message on valid registration', async () => {
        (authService.register as any).mockResolvedValue({ id: 1, email: 'new@test.com' });
        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('name@nexus.com'), 'new@test.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'SecureP@ss1');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /initialize account/i }));

        await waitFor(() => {
            expect(screen.getByText(/clearance granted/i)).toBeInTheDocument();
        });
    });

    it('shows error on duplicate email', async () => {
        (authService.register as any).mockRejectedValue(
            new Error('The user with this username already exists in the system.')
        );
        render(<RegisterPage />);

        await user.type(screen.getByPlaceholderText('name@nexus.com'), 'dup@test.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'SecureP@ss1');
        await user.click(screen.getByRole('checkbox'));
        await user.click(screen.getByRole('button', { name: /initialize account/i }));

        await waitFor(() => {
            expect(screen.getByText(/already exists/i)).toBeInTheDocument();
        });
    });

    it('enforces minimum password length of 8 characters', () => {
        render(<RegisterPage />);
        const passwordInput = screen.getByPlaceholderText('••••••••');
        expect(passwordInput).toHaveAttribute('minLength', '8');
    });
});
