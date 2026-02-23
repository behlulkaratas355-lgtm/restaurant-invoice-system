import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://45.144.176.150:5000/api';

console.log('✅ API URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('Request:', config.method.toUpperCase(), config.url);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('Response error:', error);
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('token', token);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token failed:', refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.log('No refresh token, redirecting to login');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh-token', { refreshToken }),
};

// Users API
export const usersAPI = {
  getAll: () => apiClient.get('/users'),
};

// Restaurants API
export const restaurantsAPI = {
  getAll: () => apiClient.get('/restaurants'),
  getById: (id) => apiClient.get(`/restaurants/${id}`),
  create: (data) => apiClient.post('/restaurants', data),
  update: (id, data) => apiClient.put(`/restaurants/${id}`, data),
  delete: (id) => apiClient.delete(`/restaurants/${id}`),
};

// Products API
export const productsAPI = {
  getAll: (filters) => apiClient.get('/products', { params: filters }),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
  getCategories: () => apiClient.get('/products/meta/categories'),
  getSuppliers: () => apiClient.get('/products/meta/suppliers'),
  getProductsList: () => apiClient.get('/products/list'),
  getPriceHistory: (id) => apiClient.get(`/products/${id}/price-history`),
};

// Invoices API
export const invoicesAPI = {
  getAll: (filters) => apiClient.get('/invoices', { params: filters }),
  getById: (id) => apiClient.get(`/invoices/${id}`),
  create: (data) => apiClient.post('/invoices', data),
  update: (id, data) => apiClient.put(`/invoices/${id}`, data),
  delete: (id) => apiClient.delete(`/invoices/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadFile: (formData) => {
    return axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('Upload progress:', percentCompleted);
      }
    });
  },
  getAll: (filters) => apiClient.get('/upload', { params: filters }),
  delete: (id) => apiClient.delete(`/upload/${id}`),
};

// Stats API
export const statsAPI = {
  get: () => apiClient.get('/stats'),
};

export default apiClient;
