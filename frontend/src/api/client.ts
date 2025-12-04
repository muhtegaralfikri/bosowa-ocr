import axios from 'axios';
import { toast } from 'sonner';

export const AUTH_STORAGE_KEY = 'bosowa-user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (raw) {
    const { token } = JSON.parse(raw);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

const logoutAndRedirect = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  if (window.location.pathname !== '/masuk') {
    window.location.href = '/masuk';
  }
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      toast.error('Sesi berakhir, silakan login kembali.');
      logoutAndRedirect();
    }
    if (status && status >= 500) {
      console.error('Server error response', error.response?.data);
      toast.error('Terjadi kesalahan server. Coba lagi beberapa saat lagi.');
    }
    return Promise.reject(error);
  },
);

export default api;
