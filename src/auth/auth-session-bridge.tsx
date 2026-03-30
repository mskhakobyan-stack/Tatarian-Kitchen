'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { useAuthStore } from './auth-store';

export function AuthSessionBridge() {
  const { data: session, status } = useSession();
  const syncSession = useAuthStore((store) => store.syncSession);

  useEffect(() => {
    syncSession(session, status);
  }, [session, status, syncSession]);

  return null;
}
