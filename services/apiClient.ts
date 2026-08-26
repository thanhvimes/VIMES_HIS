import { OrganizationInfo, UserSession } from '../types/common';

// Helper to safely access environment variables
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
    const userSession = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
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
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('userInfo');
            sessionStorage.removeItem('isAuthenticated');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('isAuthenticated');
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

  public async getWithMeta<T>(endpoint: string, params?: RequestOptions['params'], options?: RequestOptions): Promise<{ data: T; headers: Headers }> {
    const { headers, skipAuthRedirect, responseType = 'json', ...restOptions } = options || {};

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    const token = this.getAuthToken();
    const requestHeaders: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...restOptions,
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || errorBody.error || `HTTP Error ${response.status}`);
      }

      const data = await response.json();
      return { data, headers: response.headers };
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw error;
    }
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

  public postBinary<T>(endpoint: string, body: Blob, contentType: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': contentType, 'Accept': 'application/json' }
    });
  }

  public putBinaryWithProgress<T>(endpoint: string, body: Blob, contentType: string, onProgress: (percent: number) => void, signal?: AbortSignal): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', `${this.baseUrl}${endpoint}`);
      const token = this.getAuthToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('Content-Type', contentType);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); };
      xhr.onerror = () => reject(new Error('Không thể kết nối máy chủ khi upload DOCX'));
      xhr.ontimeout = () => reject(new Error('Upload DOCX quá thời gian cho phép'));
      xhr.onload = () => {
        let data: any;
        try { data = JSON.parse(xhr.responseText || '{}'); } catch { data = {}; }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.message || `Upload thất bại (${xhr.status})`));
      };
      xhr.timeout = TIMEOUT;
      signal?.addEventListener('abort', () => xhr.abort(), { once: true });
      xhr.onabort = () => reject(new Error('Upload đã được hủy'));
      xhr.send(body);
    });
  }
}

export const apiClient = new ApiClient(BASE_URL);
