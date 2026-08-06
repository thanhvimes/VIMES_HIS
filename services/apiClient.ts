import { OrganizationInfo, UserSession } from '../types/common';

// Helper to safely access environment variables
// --- FIX: Added explicit return type 'any' to resolve property access errors on 'env' ---
const getEnv = (): any => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env;
    }
  } catch (e) {
    // Ignore errors
  }
  return {};
};

const env = getEnv();

// CẤU HÌNH QUAN TRỌNG: API Base URL
// Sử dụng relative URL để tự động kết nối với server hiện tại
// Có thể override bằng VITE_API_BASE_URL trong .env nếu cần
const BASE_URL = env.VITE_API_BASE_URL || '/api/v1';

const TIMEOUT = Number(env.VITE_API_TIMEOUT) || 30000;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuthRedirect?: boolean;
  responseType?: 'json' | 'blob' | 'text';
}


class ApiClient {
  public baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    console.log(`[API Client] Initialized with Base URL: ${this.baseUrl}`);
  }

  private getAuthToken(): string | null {
    const userSession = localStorage.getItem('currentUser');
    if (userSession) {
      try {
        const parsed = JSON.parse(userSession);
        return parsed.token || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, skipAuthRedirect, responseType = 'json', ...restOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    const token = this.getAuthToken();

    // 🔍 DEBUG LOGGING

    const defaultHeaders: HeadersInit = {
      ...(responseType === 'json' ? {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      } : {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...headers,
    };


    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      console.log(`[API Request] ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, {
        headers: defaultHeaders,
        signal: controller.signal,
        ...restOptions,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          if (!skipAuthRedirect) {
            localStorage.removeItem('currentUser');
            window.location.href = '/';
          }
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || errorBody.message || 'Phiên đăng nhập hết hạn.');
        }

        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = errorBody.message || errorBody.error || `HTTP Error ${response.status}: ${response.statusText}`;
        console.error(`[API Error] ${errorMessage}`);
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return {} as T;
      }

      let data;
      if (responseType === 'blob') {
        data = await response.blob();
      } else if (responseType === 'text') {
        data = await response.text();
      } else {
        data = await response.json();
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Kết nối Backend thất bại (Timeout). Vui lòng kiểm tra Server 3000.');
      }
      console.error(`[API Exception] ${endpoint}:`, error);
      throw error;
    }
  }

  public get<T>(endpoint: string, params?: RequestOptions['params'], options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  public post<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
  }

  public put<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
  }

  public patch<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
  }

  public delete<T>(endpoint: string, params?: RequestOptions['params'], options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', params });
  }

  public upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const { headers, ...rest } = options || {};
    return this.request<T>(endpoint, {
      ...rest,
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
        'Content-Type': undefined as any
      }
    });
  }

  public putBinary<T>(endpoint: string, body: Blob, contentType: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
      headers: { 'Content-Type': contentType, 'Accept': 'application/json' }
    });
  }
}

export const apiClient = new ApiClient(BASE_URL);
