import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, UserDTO } from '@vorizon/shared';

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  // True once the persisted store has finished loading from localStorage.
  // Routes must wait for this before checking accessToken — otherwise a hard
  // page reload briefly sees a null token (rehydration is async) and bounces
  // an already-logged-in user to /login.
  hasHydrated: boolean;
  setAuth: (user: UserDTO, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: UserDTO) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      hasHydrated: false,
      setAuth: (user, tokens) =>
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'vorizon-auth',
      onRehydrateStorage: () => () => useAuthStore.setState({ hasHydrated: true }),
    },
  ),
);
// Safety net: zustand's persist "finished hydrating" callback can, in some
// environments, never fire even though the underlying state was already
// merged in from storage — without this, a route guard gating on
// `hasHydrated` would spin forever. 50ms is far longer than a localStorage
// read ever takes, so this never races a legitimate slow hydration.
setTimeout(() => {
  if (!useAuthStore.getState().hasHydrated) useAuthStore.setState({ hasHydrated: true });
}, 50);
