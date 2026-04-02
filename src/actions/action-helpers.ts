import 'server-only';

import type { Session } from 'next-auth';

import { auth } from '@/auth/auth';

interface OwnedRecord {
  ownerId: string | null;
}

export type OwnedRecordAccess<TRecord extends OwnedRecord> =
  | {
      status: 'not-found';
      record: null;
    }
  | {
      status: 'forbidden';
      record: TRecord;
    }
  | {
      status: 'allowed';
      record: TRecord;
    };

/**
 * Из сессии нам нужен только id пользователя, поэтому держим это чтение
 * в одном месте и не дублируем одинаковые проверки по проекту.
 */
export function getSessionUserId(session: Session | null): string | null {
  return typeof session?.user?.id === 'string' ? session.user.id : null;
}

/**
 * Server actions используют одинаковое правило: если id в сессии нет,
 * считаем пользователя неавторизованным.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  return getSessionUserId(await auth());
}

/**
 * Унифицируем проверку владения записью, чтобы `not found` и `forbidden`
 * обрабатывались одинаково в разных action-ах.
 */
export function getOwnedRecordAccess<TRecord extends OwnedRecord>(
  record: TRecord | null,
  userId: string,
): OwnedRecordAccess<TRecord> {
  if (!record) {
    return {
      status: 'not-found',
      record: null,
    };
  }

  if (record.ownerId !== userId) {
    return {
      status: 'forbidden',
      record,
    };
  }

  return {
    status: 'allowed',
    record,
  };
}
