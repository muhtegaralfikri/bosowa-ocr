import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

export const AUTH_STORAGE_KEY = 'bosowa-user';

const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const apiBase = apiOrigin ? `${apiOrigin}/api/v1` : '/api/v1';
const api = axios.create({
  baseURL: apiBase,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getStoredAuth = () => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};

const updateStoredTokens = (accessToken: string, refreshToken: string) => {
  const auth = getStoredAuth();
  if (auth) {
    auth.token = accessToken;
    auth.refreshToken = refreshToken;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }
};

const logoutAndRedirect = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Handle 401 - try refresh token
    if (status === 401 && !originalRequest._retry) {
      const auth = getStoredAuth();

      // Skip refresh for login/refresh endpoints
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (!auth?.refreshToken) {
        logoutAndRedirect();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${apiBase}/auth/refresh`, {
          refreshToken: auth.refreshToken,
        });

        const { accessToken, refreshToken } = res.data;
        updateStoredTokens(accessToken, refreshToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        toast.error('Sesi berakhir, silakan login kembali.');
        logoutAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 - forbidden
    if (status === 403) {
      toast.error('Anda tidak memiliki akses ke halaman ini.');
    }

    // Handle 500+ - server errors
    if (status && status >= 500) {
      console.error('Server error response', error.response?.data);
      toast.error('Terjadi kesalahan server. Coba lagi beberapa saat lagi.');
    }

    return Promise.reject(error);
  },
);

export default api;
