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

/**
 * Статус храним отдельно, чтобы UI мог показывать промежуточные состояния
 * вроде "идёт вход" или "идёт выход", не дожидаясь обновления сессии.
 */
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

/**
 * Превращаем объект `session.user` в упрощённую форму для клиентского стора.
 */
function getAuthUser(session: Session | null): AuthUser | null {
  const user = session?.user;

  if (!user) {
    return null;
  }

  return {
    id: typeof user.id === 'string' ? user.id : null,
    email: typeof user.email === 'string' ? user.email : null,
    name: typeof user.name === 'string' ? user.name : null,
  };
}

/**
 * Из сессии получаем состояние, которое удобно читать любому компоненту интерфейса.
 */
function getAuthState(
  session: Session | null,
  status: AuthStatus = session ? 'authenticated' : 'unauthenticated',
): AuthState {
  return {
    status,
    user: getAuthUser(session),
  };
}

/**
 * Создаём store один раз на провайдер и описываем все публичные операции
 * вокруг авторизации в одном месте.
 */
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
      set((state) => {
        /**
         * `useSession()` может на короткое время уйти в `loading` без данных.
         * В этот момент не хотим терять уже известного пользователя и мигать UI.
         */
        if (status === 'loading') {
          const nextUser = getAuthUser(session) ?? state.user;

          return {
            status: nextUser ? 'authenticated' : state.status,
            user: nextUser,
          };
        }

        return getAuthState(session, status);
      }),
  }));
}

const AuthStoreContext = createContext<AuthStoreApi | null>(null);

interface AuthStoreProviderProps {
  children: ReactNode;
  initialSession: Session | null;
}

/**
 * Провайдер стабилизирует экземпляр стора через `useState`, чтобы он
 * не пересоздавался на каждом рендере оболочки.
 */
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

/**
 * Внешний хук скрывает детали работы Zustand и гарантирует,
 * что store используется только внутри провайдера.
 */
export function useAuthStore<T>(selector: (store: AuthStore) => T): T {
  const store = useContext(AuthStoreContext);

  if (!store) {
    throw new Error('useAuthStore must be used within AuthStoreProvider');
  }

  return useStore(store, selector);
}
