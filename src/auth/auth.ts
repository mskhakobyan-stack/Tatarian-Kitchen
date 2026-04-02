import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import NextAuth from 'next-auth';
import { unstable_rethrow } from 'next/navigation';
import Credentials from 'next-auth/providers/credentials';
import { ZodError } from 'zod';

import { verifyPassword } from '@/auth/password';
import { prisma } from '@/lib/prisma';
import { signInSchema } from '@/schema/zod';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
const AUTH_SECRET =
  process.env.AUTH_SECRET
  ?? process.env.NEXTAUTH_SECRET
  ?? null;

interface AuthorizedUser {
  email: string;
  id: string;
  name: string;
}

interface TokenUserPayload {
  email?: string | null;
  id?: string;
  name?: string | null;
}

/**
 * После успешного входа сохраняем ключевые данные пользователя в JWT,
 * чтобы сессия могла восстанавливаться без дополнительных запросов к БД.
 */
function applyUserToToken(token: JWT, user?: TokenUserPayload): JWT {
  if (!user?.id) {
    return token;
  }

  token.id = user.id;

  if (typeof user.email === 'string') {
    token.email = user.email;
  }

  if (typeof user.name === 'string') {
    token.name = user.name;
  }

  return token;
}

/**
 * При чтении сессии переносим данные из токена обратно в `session.user`,
 * чтобы клиентский код получал единый объект пользователя.
 */
function applyTokenToSession(session: Session, token: JWT): Session {
  if (!session.user) {
    return session;
  }

  const tokenId = typeof token.id === 'string' ? token.id : token.sub;

  if (tokenId) {
    session.user.id = tokenId;
  }

  session.user.email =
    typeof token.email === 'string' ? token.email : session.user.email;
  session.user.name =
    typeof token.name === 'string' ? token.name : session.user.name;

  return session;
}

/**
 * Credentials-провайдер ищет пользователя в базе и проверяет пароль.
 * Все ошибки валидации скрываем за `null`, чтобы не раскрывать лишние детали.
 */
async function authorizeCredentials(
  credentials: unknown,
): Promise<AuthorizedUser | null> {
  try {
    const { email, password } = await signInSchema.parseAsync(credentials);

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      /**
       * Явно выбираем только поля, которые реально нужны для входа.
       *
       * Это делает auth-поток стабильнее: Prisma не пытается читать служебные
       * поля вроде `createdAt`, которые не участвуют в авторизации.
       */
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.email.split('@')[0],
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return null;
    }

    throw error;
  }
}

/**
 * Конфиг next-auth описывает весь auth-поток приложения:
 * как создаётся сессия, как обогащается JWT и как проходит вход по credentials.
 */
const authResult = NextAuth({
  secret: AUTH_SECRET ?? undefined,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, user }) {
      return applyUserToToken(token, user);
    },
    async session({ session, token }) {
      return applyTokenToSession(session, token);
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: authorizeCredentials,
    }),
  ],
  logger: {
    error(error) {
      console.error('[auth]', error);
    },
    warn(code) {
      console.warn('[auth]', code);
    },
  },
});

export const { handlers, signIn, signOut, auth } = authResult;

/**
 * Для публичных страниц не хотим ронять весь рендер из-за сбоя auth-конфига
 * или временной ошибки session endpoint.
 */
export async function getOptionalSession(): Promise<{
  authAvailable: boolean;
  session: Session | null;
}> {
  try {
    return {
      authAvailable: true,
      session: await auth(),
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error('[auth] Failed to resolve session in server component', error);

    return {
      authAvailable: false,
      session: null,
    };
  }
}
