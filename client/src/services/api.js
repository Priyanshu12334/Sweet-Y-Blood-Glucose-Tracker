import axios from 'axios';

const apiOrigin = `${window.location.protocol}//${window.location.hostname}:5000`;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `${apiOrigin}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
