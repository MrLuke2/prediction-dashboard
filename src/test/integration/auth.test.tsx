import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthModal } from '../../components/ui/AuthModal';
import { useUIStore } from '../../store';
import { authApi } from '../../services/api/authApi';
import { resetAllStores } from '../mocks/storeMocks';

vi.mock('../../services/api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  }
}));

describe('AuthModal Integration', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    resetAllStores();
    onClose.mockClear();
    vi.clearAllMocks();
  });

  it('renders login tab by default', () => {
    render(<AuthModal isOpen={true} onClose={onClose} />);
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('operator@alpha-mode.ai')).toBeInTheDocument();
  });

  it('calls authApi.login and updates store on success', async () => {
    const user = userEvent.setup();
    const mockResponse = { token: 'jwt-123', user: { id: '1', email: 'test@example.com', username: 'testuser' } };
    (authApi.login as any).mockResolvedValue(mockResponse);

    render(<AuthModal isOpen={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('operator@alpha-mode.ai'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'password123456');
    
    await user.click(screen.getByRole('button', { name: /Initiate Session/i }));

    expect(authApi.login).toHaveBeenCalledWith('test@example.com', 'password123456');
    
    await waitFor(() => {
      expect(useUIStore.getState().jwt).toBe('jwt-123');
      expect(useUIStore.getState().user).toEqual(mockResponse.user);
      expect(onClose).toHaveBeenCalled();
    });
  }, 15000);

  it('shows error message on 401/failure', async () => {
    const user = userEvent.setup();
    (authApi.login as any).mockRejectedValue(new Error('Invalid credentials'));

    render(<AuthModal isOpen={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText('operator@alpha-mode.ai'), 'bad@example.com');
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Initiate Session/i }));

    await waitFor(() => {
      expect(screen.getByText(/ERROR: Invalid credentials/i)).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('renders password strength bar on register tab', async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: /Register/i }));
    
    expect(screen.getByText(/Entropy: None/i)).toBeInTheDocument();
    
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'weak');
    expect(screen.getByText(/Entropy: Critical/i)).toBeInTheDocument();
    
    await user.type(screen.getByPlaceholderText('••••••••••••'), 'Password123!');
    // Entropy levels: 0 (none), 1 (<8), 2 (<12), 4 (strong), 3 (default)
    // "weakPassword123!" is > 12 chars and has complex chars
  });

  it('shows active AI provider in footer', () => {
    useUIStore.getState().setAIProvider({ providerId: 'anthropic', model: 'claude-sonnet-4-5' });
    render(<AuthModal isOpen={true} onClose={onClose} />);
    
    expect(screen.getByText('Claude')).toBeInTheDocument();
    expect(screen.getByText('claude-sonnet-4-5')).toBeInTheDocument();
  });
});
