'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

import { AuthSessionBridge } from '@/auth/auth-session-bridge';
import { AuthStoreProvider } from '@/auth/auth-store';

interface AuthSessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

export function AuthSessionProvider({
  children,
  session,
}: AuthSessionProviderProps) {
  return (
    <SessionProvider session={session}>
      <AuthStoreProvider initialSession={session}>
        <AuthSessionBridge />
        {children}
      </AuthStoreProvider>
    </SessionProvider>
  );
}
