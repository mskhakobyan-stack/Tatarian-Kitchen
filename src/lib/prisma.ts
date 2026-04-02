import 'server-only';

import { withAccelerate } from '@prisma/extension-accelerate';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * Кэшируем Prisma Client в глобальной области только для dev-режима,
 * чтобы HMR не создавал новые подключения при каждом обновлении модулей.
 */
type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalPrismaCache = globalThis as typeof globalThis & {
  prisma?: ExtendedPrismaClient;
};

/**
 * Для runtime через Accelerate нужен `prisma+postgres` URL, который Prisma Client
 * будет использовать вместо прямого TCP-подключения к базе.
 */
function getAccelerateUrl(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  return connectionString;
}

/**
 * Создаём Prisma Client в режиме Accelerate и сразу подключаем extension,
 * чтобы были доступны cacheStrategy и invalidate-операции.
 */
function createPrismaClient() {
  return new PrismaClient({
    accelerateUrl: getAccelerateUrl(),
  }).$extends(withAccelerate());
}

// В production создаём клиента один раз на процесс, в development — переиспользуем.
export const prisma = globalPrismaCache.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalPrismaCache.prisma = prisma;
}

/**
 * Явно прогреваем соединение на старте контейнера, чтобы не ждать lazy-connect
 * во время первого реального запроса.
 */
void prisma.$connect().catch((error: unknown) => {
  console.error('Failed to warm Prisma connection', error);
});
