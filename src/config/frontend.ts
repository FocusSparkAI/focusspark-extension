const frontendBaseUrl = import.meta.env.VITE_FRONTEND_BASE_URL;

export const FRONTEND_BASE_URL = frontendBaseUrl.replace(/\/+$/, '');

export const FRONTEND_ROUTES = {
  home: '/',
  science: '/science',
  about: '/about',
  contact: '/contact',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  goals: '/goals',
  achievements: '/achievements',
  profile: '/profile',
  settings: '/settings',
  notifications: '/notifications',
} as const;

export function buildFrontendUrl(path: string): string {
  return new URL(path, FRONTEND_BASE_URL).toString();
}
