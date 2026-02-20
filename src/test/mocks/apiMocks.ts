import { vi } from 'vitest';

export const createMockUser = (overrides?: any) => ({
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  avatar: null,
  ...overrides,
});

export const mockUser = createMockUser();

export const authApi = {
  login: vi.fn().mockResolvedValue({ token: 'mock-token', user: mockUser }),
  register: vi.fn().mockResolvedValue({ token: 'mock-token', user: mockUser }),
  logout: vi.fn().mockResolvedValue(undefined),
  getMe: vi.fn().mockResolvedValue(mockUser),
};

vi.mock('@/services/api/authApi', () => ({
  authApi,
}));
