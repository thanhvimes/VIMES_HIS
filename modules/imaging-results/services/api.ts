import axios from 'axios';

// Function to reliably retrieve authentication token from all possible storage locations
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  // 1. Check currentUser in sessionStorage / localStorage (VIMES_HIS standard)
  const userSession = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
  if (userSession) {
    try {
      const parsed = JSON.parse(userSession);
      if (parsed.token) return parsed.token;
    } catch {}
  }

  // 2. Check other common token keys
  const token =
    localStorage.getItem('vclinic_token') ||
    localStorage.getItem('pacs_jwt_token') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('pacs_jwt_token') ||
    sessionStorage.getItem('token');

  return token || null;
};

// Base URL for API
const getApiBaseUrl = () => {
  return '/api';
};

export const getMediaUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return url;
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
