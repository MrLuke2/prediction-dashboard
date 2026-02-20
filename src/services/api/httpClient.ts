import { useUIStore } from '../../store';

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  body?: any;
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { jwt } = useUIStore.getState();
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (jwt) {
    headers.set('Authorization', `Bearer ${jwt}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: options.credentials || 'include',
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);

  if (response.status === 401 && path !== '/auth/refresh' && path !== '/auth/login' && path !== '/auth/register') {
    // Attempt refresh
    try {
      const refreshed = await httpClient.post<any>('/auth/refresh');
      if (refreshed.token && refreshed.user) {
        useUIStore.getState().setAuth(refreshed.token, refreshed.user);
        
        // Retry original request
        const retryHeaders = new Headers(headers);
        retryHeaders.set('Authorization', `Bearer ${refreshed.token}`);
        const retryResponse = await fetch(`${BASE_URL}${path}`, {
          ...config,
          headers: retryHeaders,
        });
        
        if (!retryResponse.ok) {
           const errorData = await retryResponse.json().catch(() => ({}));
           throw new ApiError(errorData.message || 'Retry failed', retryResponse.status, errorData.code);
        }
        
        if (retryResponse.status === 204) return {} as T;
        return await retryResponse.json();
      }
    } catch (e) {
      useUIStore.getState().clearAuth();
      throw e;
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.message || 'An unexpected error occurred',
      response.status,
      errorData.code
    );
  }

  if (response.status === 204) return {} as T;
  return await response.json();
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: any, options?: RequestOptions) => request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
