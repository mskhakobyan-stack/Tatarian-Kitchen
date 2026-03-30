import type { DefaultSession } from 'next-auth';
import 'next-auth';
import 'next-auth/jwt';

/**
 * Расширяем типы next-auth под фактические данные приложения.
 *
 * Мы сохраняем `id` пользователя в JWT и прокидываем его в `session.user`,
 * поэтому описываем это явно, чтобы код auth-слоя был типобезопасным.
 */
declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id?: string | null;
    };
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
  }
}
