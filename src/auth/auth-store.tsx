'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from 'next-auth';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthUser {
  id: string | null;
  email: string | null;
  name: string | null;
}

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

interface AuthActions {
  clearAuth: () => void;
  setStatus: (status: AuthStatus) => void;
  syncSession: (session: Session | null, status?: AuthStatus) => void;
}

type AuthStore = AuthState & AuthActions;
type AuthStoreApi = ReturnType<typeof createAuthStore>;

function getAuthUser(session: Session | null): AuthUser | null {
  const user = session?.user;

  if (!user) {
    return null;
  }

  const userId =
    'id' in user && typeof user.id === 'string' ? user.id : null;

  return {
    id: userId,
    email: typeof user.email === 'string' ? user.email : null,
    name: typeof user.name === 'string' ? user.name : null,
  };
}

function getAuthState(
  session: Session | null,
  status: AuthStatus = session ? 'authenticated' : 'unauthenticated',
): AuthState {
  return {
    status,
    user: getAuthUser(session),
  };
}

function createAuthStore(initialSession: Session | null) {
  return createStore<AuthStore>()((set) => ({
    ...getAuthState(initialSession),
    clearAuth: () =>
      set({
        status: 'unauthenticated',
        user: null,
      }),
    setStatus: (status) =>
      set((state) => ({
        ...state,
        status,
      })),
    syncSession: (session, status) =>
      set(() => getAuthState(session, status)),
  }));
}

const AuthStoreContext = createContext<AuthStoreApi | null>(null);

interface AuthStoreProviderProps {
  children: ReactNode;
  initialSession: Session | null;
}

export function AuthStoreProvider({
  children,
  initialSession,
}: AuthStoreProviderProps) {
  const [store] = useState(() => createAuthStore(initialSession));

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  );
}

export function useAuthStore<T>(selector: (store: AuthStore) => T): T {
  const store = useContext(AuthStoreContext);

  if (!store) {
    throw new Error('useAuthStore must be used within AuthStoreProvider');
  }

  return useStore(store, selector);
}
