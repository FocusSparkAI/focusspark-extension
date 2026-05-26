import axios from 'axios';
import { BACKEND_BASE_URL } from '../config/backend';
import type { InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'fs_access_token';

export async function getAccessToken(): Promise<string | null> {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token && token.length > 0 ? token : null;
  } catch (e) {
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    // ignore
  }
}

export async function clearAccessToken(): Promise<void> {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    // ignore
  }
}

export async function getAuthHeaders() {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Create a configured axios instance for backend requests
const api = axios.create({
  baseURL: BACKEND_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to requests for the created instance
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore storage errors and continue without token
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Also attach to the global axios so files that import `axios` directly
// will also send the Authorization header when available.
axios.defaults.baseURL = BACKEND_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
