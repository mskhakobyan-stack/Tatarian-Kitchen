'use client';

import { useState, useTransition } from 'react';

type MutationTone = 'error' | 'success';

/**
 * Списки с CRUD-кнопками используют одинаковый UI-сценарий:
 * показать один статус, подсветить pending-запись и сбросить её после запроса.
 */
export function useItemMutationState() {
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<MutationTone>('success');
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setSuccessMessage = (message: string) => {
    setStatusTone('success');
    setStatusMessage(message);
  };

  const setErrorMessage = (message: string) => {
    setStatusTone('error');
    setStatusMessage(message);
  };

  const runForItem = (itemId: string, action: () => Promise<void>) => {
    setPendingItemId(itemId);

    startTransition(async () => {
      try {
        await action();
      } finally {
        setPendingItemId(null);
      }
    });
  };

  const isItemPending = (itemId: string) =>
    isPending && pendingItemId === itemId;

  return {
    isPending,
    pendingItemId,
    statusMessage,
    statusTone,
    setSuccessMessage,
    setErrorMessage,
    runForItem,
    isItemPending,
  };
}
