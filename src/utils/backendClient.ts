import axios from 'axios';
import { BACKEND_BASE_URL } from '../config/backend';
import type { InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'fs_access_token';

type ChromeStorageLike = {
  get: (keys: string | string[] | object | null, callback: (items: Record<string, any>) => void) => void;
  set: (items: Record<string, any>, callback?: () => void) => void;
  remove: (keys: string | string[], callback?: () => void) => void;
};

function getChromeStorageLocal(): ChromeStorageLike | null {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: any }).chrome;
  return chromeApi?.storage?.local ?? null;
}

export async function getAccessToken(): Promise<string | null> {
  const storage = getChromeStorageLocal();
  if (!storage) {
    // Fallback to localStorage for dev / non-extension environments
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      return token && token.length > 0 ? token : null;
    } catch (e) {
      return null;
    }
  }

  return await new Promise((resolve) => {
    storage.get(TOKEN_KEY, (items) => {
      const token = items?.[TOKEN_KEY];
      resolve(typeof token === 'string' && token.length > 0 ? token : null);
    });
  });
}

export async function setAccessToken(token: string): Promise<void> {
  const storage = getChromeStorageLocal();
  if (!storage) {
    // Fallback to localStorage for dev / non-extension environments
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      // ignore
    }
    return;
  }

  await new Promise<void>((resolve) => {
    storage.set({ [TOKEN_KEY]: token }, () => resolve());
  });
}

export async function clearAccessToken(): Promise<void> {
  const storage = getChromeStorageLocal();
  if (!storage) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      // ignore
    }
    return;
  }

  await new Promise<void>((resolve) => {
    storage.remove(TOKEN_KEY, () => resolve());
  });
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
