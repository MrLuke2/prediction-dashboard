import { vi } from 'vitest';
import { UserProfile } from '../../services/api/authApi';

export const createMockUser = (overrides?: Partial<UserProfile>): UserProfile => ({
  id: 'user-123',
  email: 'test@example.com',
  plan: 'pro',
  ...overrides,
});

export const mockUser = createMockUser();

export const authApi = {
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getMe: vi.fn(),
};

// Default implementations if needed
authApi.login.mockResolvedValue({ token: 'mock-token', user: mockUser });
authApi.register.mockResolvedValue({ token: 'mock-token', user: mockUser });
authApi.logout.mockResolvedValue(undefined);
authApi.getMe.mockResolvedValue(mockUser);

vi.mock('@/services/api/authApi', () => ({
  authApi,
}));
