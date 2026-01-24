import axios from 'axios';

const api = axios.create({
  baseURL: 'http://45.144.176.150:5000/api',
  timeout: 20000,
});

// request: добавляем токен
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// response: редирект ТОЛЬКО на 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // ВАЖНО: network/cors/timeout НЕ должны разлогинивать
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      // редирект, но без бесконечных циклов
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
