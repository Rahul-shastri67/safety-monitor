import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sm_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.url !== '/auth/login') {
      localStorage.removeItem('sm_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Typed API helpers ────────────────────────────────────────────────────────
export const authAPI = {
  login:          (d) => api.post('/auth/login', d),
  register:       (d) => api.post('/auth/register', d),
  me:             ()  => api.get('/auth/me'),
  updateProfile:  (d) => api.put('/auth/profile', d),
  changePassword: (d) => api.put('/auth/change-password', d),
};

export const alertAPI = {
  getAll:        (p) => api.get('/alerts', { params: p }),
  getById:       (id) => api.get(`/alerts/${id}`),
  detect:        (d) => api.post('/alerts/detect', d),
  uploadDetect:  (f) => api.post('/alerts/upload-detect', f, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  acknowledge:   (id, d) => api.put(`/alerts/${id}/acknowledge`, d),
  resolve:       (id, d) => api.put(`/alerts/${id}/resolve`, d),
  getStats:      (p) => api.get('/alerts/stats/summary', { params: p }),
};

export const adminAPI = {
  getUsers:      (p) => api.get('/admin/users', { params: p }),
  updateUser:    (id, d) => api.put(`/admin/users/${id}`, d),
  deleteUser:    (id) => api.delete(`/admin/users/${id}`),
  getCameras:    () => api.get('/admin/cameras'),
  createCamera:  (d) => api.post('/admin/cameras', d),
  updateCamera:  (id, d) => api.put(`/admin/cameras/${id}`, d),
  deleteCamera:  (id) => api.delete(`/admin/cameras/${id}`),
  systemStats:   () => api.get('/admin/system-stats'),
  bulkDelete:    (d) => api.delete('/admin/alerts/bulk', { data: d }),
};

export const analyticsAPI = {
  dashboard:    () => api.get('/analytics/dashboard'),
  heatmap:      (p) => api.get('/analytics/heatmap', { params: p }),
  cameraStats:  () => api.get('/analytics/camera-stats'),
};

export const cameraAPI = {
  getAll:       () => api.get('/camera'),
  simulate:     (id, d) => api.post(`/camera/${id}/simulate`, d),
  updateStatus: (id, d) => api.put(`/camera/${id}/status`, d),
};

export default api;
