import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../store/authStore';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const tokens = res.data.data.tokens;
    setTokens(tokens);
    return tokens.accessToken;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a human-readable message from an axios error. */
export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { message?: string; details?: unknown } } | undefined;
    return data?.error?.message ?? err.message;
  }
  return err instanceof Error ? err.message : 'Unknown error';
}

export function apiErrorDetails(err: unknown): { missing?: string[] } | undefined {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: { details?: { missing?: string[] } } } | undefined;
    return data?.error?.details;
  }
  return undefined;
}
