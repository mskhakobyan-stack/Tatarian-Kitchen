'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

import { useAuthStore } from './auth-store';

/**
 * Мост синхронизирует live-сессию next-auth с нашим Zustand-store.
 *
 * Благодаря этому интерфейс читает одно локальное состояние, а не тянет
 * `useSession()` в каждый компонент отдельно.
 */
export function AuthSessionBridge() {
  const { data: session, status } = useSession();
  const syncSession = useAuthStore((store) => store.syncSession);

  useEffect(() => {
    // Каждый раз, когда next-auth обновляет сессию, зеркалим это в store.
    syncSession(session, status);
  }, [session, status, syncSession]);

  return null;
}
