
import { OrganizationInfo, UserSession } from '../types/common';

// Helper to safely access environment variables
const getEnv = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env;
    }
  } catch (e) {
    // Ignore errors in environments where import.meta is not supported
  }
  return {};
};

const env = getEnv();

const BASE_URL = env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const TIMEOUT = Number(env.VITE_API_TIMEOUT) || 30000;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Helper để lấy Token từ LocalStorage
   */
  private getAuthToken(): string | null {
    // Logic này có thể thay đổi tùy theo cách bạn lưu token (Cookie/LocalStorage)
    const userSession = localStorage.getItem('currentUser');
    if (userSession) {
      try {
        const parsed = JSON.parse(userSession);
        return parsed.token || null; // Giả sử token nằm trong object user
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Xử lý chung cho các request
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, ...restOptions } = options;
    
    // 1. Xử lý URL params
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

    // 2. Xử lý Headers (Mặc định JSON + Auth Token)
    const token = this.getAuthToken();
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...headers,
    };

    // 3. Setup Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const response = await fetch(url, {
        headers: defaultHeaders,
        signal: controller.signal,
        ...restOptions,
      });

      clearTimeout(timeoutId);

      // 4. Xử lý lỗi HTTP
      if (!response.ok) {
        // Xử lý trường hợp 401 Unauthorized -> Logout
        if (response.status === 401) {
            localStorage.removeItem('currentUser');
            window.location.href = '/'; // Redirect to login
            throw new Error('Phiên đăng nhập hết hạn.');
        }

        const errorBody = await response.json().catch(() => ({}));
        const errorMessage = errorBody.message || `HTTP Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // 5. Trả về data (Xử lý trường hợp No Content 204)
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Yêu cầu quá thời gian phản hồi (Timeout).');
      }
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // --- Public Methods ---

  public get<T>(endpoint: string, params?: RequestOptions['params'], options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  public post<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  public put<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  public patch<T>(endpoint: string, body: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  }

  public delete<T>(endpoint: string, params?: RequestOptions['params'], options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', params });
  }
  
  public upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
      // Khi upload FormData, không set Content-Type là application/json
      // Fetch tự động set Content-Type là multipart/form-data kèm boundary
      const { headers, ...rest } = options || {};
      return this.request<T>(endpoint, {
          ...rest,
          method: 'POST',
          body: formData,
          headers: {
              ...headers,
              'Content-Type': undefined as any // Xóa Content-Type mặc định
          }
      });
  }
}

export const apiClient = new ApiClient(BASE_URL);
