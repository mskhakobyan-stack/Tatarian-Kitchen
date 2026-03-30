import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';

/**
 * Кэшируем Prisma Client в глобальной области только для dev-режима,
 * чтобы HMR не создавал новые подключения при каждом обновлении модулей.
 */
const globalPrismaCache = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

/**
 * Отдельный helper даёт более ясную ошибку, если переменная окружения не задана.
 */
function getDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  return connectionString;
}

/**
 * Создаём Prisma Client поверх pg-адаптера, который работает с connection string.
 */
function createPrismaClient() {
  const adapter = new PrismaPg(getDatabaseUrl());

  return new PrismaClient({ adapter });
}

// В production создаём клиента один раз на процесс, в development — переиспользуем.
export const prisma = globalPrismaCache.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalPrismaCache.prisma = prisma;
}
