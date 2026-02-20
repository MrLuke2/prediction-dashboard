import { httpClient } from './httpClient';

export interface UserProfile {
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export const authApi = {
  register: (email: string, password: string): Promise<AuthResponse> => 
    httpClient.post<AuthResponse>('/auth/register', { email, password }),

  login: (email: string, password: string): Promise<AuthResponse> => 
    httpClient.post<AuthResponse>('/auth/login', { email, password }),

  logout: (): Promise<void> => 
    httpClient.post<void>('/auth/logout'),

  refreshToken: (): Promise<AuthResponse> => 
    httpClient.post<AuthResponse>('/auth/refresh'),

  getMe: (): Promise<UserProfile> => 
    httpClient.get<UserProfile>('/auth/me'),
};
