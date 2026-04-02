'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { AuthSessionBridge } from '@/auth/auth-session-bridge';
import { AuthStoreProvider } from '@/auth/auth-store';

interface AuthSessionProviderProps {
  authAvailable: boolean;
  children: React.ReactNode;
  session: Session | null;
}

/**
 * Здесь собираем все клиентские провайдеры, связанные с авторизацией.
 *
 * `SessionProvider` отдаёт данные next-auth, `AuthStoreProvider` строит локальный
 * Zustand-store, а `AuthSessionBridge` держит их синхронными между собой.
 */
export function AuthSessionProvider({
  authAvailable,
  children,
  session,
}: AuthSessionProviderProps) {
  if (!authAvailable) {
    return (
      <AuthStoreProvider initialSession={null}>
        {children}
      </AuthStoreProvider>
    );
  }

  return (
    <SessionProvider session={session}>
      <AuthStoreProvider initialSession={session}>
        <AuthSessionBridge />
        {children}
      </AuthStoreProvider>
    </SessionProvider>
  );
}
