import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('unysol_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('unysol_token');
      localStorage.removeItem('unysol_user');
      window.location.href = '/';
    }
    if (error.response?.status === 403) {
      // Permission denied — set flag for UI to show access denied message
      sessionStorage.setItem('unysol_403', error.config?.url || '');
    }
    return Promise.reject(error);
  }
);

export default api;
