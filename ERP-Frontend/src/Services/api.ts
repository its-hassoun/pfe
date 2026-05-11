import axios, { AxiosError, type AxiosInstance } from 'axios';

const HELPDESK_BASE = import.meta.env.VITE_API_URL || '/api/helpdesk';
const TIMESHEET_BASE = '/api/timesheet';
const HUB_BASE = import.meta.env.VITE_HUB_URL || '/hubs/notifications';

const TOKEN_KEY = 'helpdesk_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (v: string) => localStorage.setItem(TOKEN_KEY, v),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

function attachInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const t = tokenStore.get();
    if (t) {
      config.headers.set('Authorization', `Bearer ${t}`);
    }
    return config;
  });
  instance.interceptors.response.use(
    (r) => r,
    (err: AxiosError) => {
      if (err.response?.status === 401) {
        tokenStore.clear();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }
      return Promise.reject(err);
    }
  );
  return instance;
}

export const helpdeskApi = attachInterceptors(
  axios.create({
    baseURL: HELPDESK_BASE,
    headers: { 'Content-Type': 'application/json' },
  })
);

export const timesheetApi = attachInterceptors(
  axios.create({
    baseURL: TIMESHEET_BASE,
    headers: { 'Content-Type': 'application/json' },
  })
);

export const hubBaseUrl = HUB_BASE;
