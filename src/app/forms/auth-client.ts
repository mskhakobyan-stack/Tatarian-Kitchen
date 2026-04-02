'use client';

import type { Session } from 'next-auth';
import { getSession, signIn } from 'next-auth/react';

export interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthNavigation {
  refresh: () => void;
  replace: (href: string) => void;
}

interface AuthSessionSync {
  clearAuth: () => void;
  syncSession: (session: Session | null) => void;
}

/**
 * Базовые credentials обе формы читают одинаково, поэтому держим helper
 * рядом с client auth-flow.
 */
export function getAuthCredentialsFromForm(
  formElement: HTMLFormElement,
): AuthCredentials | null {
  const formData = new FormData(formElement);
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  return { email, password };
}

/**
 * Вход по credentials нужен и для обычной формы входа, и для автологина
 * после регистрации, поэтому держим вызов `signIn` в одном месте.
 */
export async function signInWithCredentials(
  credentials: AuthCredentials,
): Promise<boolean> {
  const result = await signIn('credentials', {
    email: credentials.email,
    password: credentials.password,
    redirect: false,
  });

  return Boolean(result && !result.error);
}

/**
 * После успешного `signIn` синхронизируем client store с фактической сессией.
 * Если сессия не восстановилась, возвращаем `null` и сбрасываем auth-state.
 */
export async function syncAuthenticatedSession({
  clearAuth,
  syncSession,
}: AuthSessionSync): Promise<Session | null> {
  const session = await getSession();

  if (!session?.user) {
    clearAuth();
    return null;
  }

  syncSession(session);

  return session;
}

/**
 * После успешной авторизации либо возвращаем пользователя туда, куда он шёл,
 * либо просто обновляем текущую страницу.
 */
export function finishAuthNavigation(
  router: AuthNavigation,
  safeCallbackUrl: string | null,
): void {
  if (safeCallbackUrl) {
    router.replace(safeCallbackUrl);
    return;
  }

  router.refresh();
}
