import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wim_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
