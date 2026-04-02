'use client';

import { useEffect, useRef } from 'react';

interface SuccessfulFormRecord {
  id: string;
}

/**
 * `useActionState` может повторно проигрывать эффекты в dev-режиме, поэтому
 * успех формы сообщаем наружу только один раз на конкретную запись.
 */
export function useReportedFormSuccess<TRecord extends SuccessfulFormRecord>(
  status: 'idle' | 'success' | 'error',
  record: TRecord | null,
  onSuccess?: (record: TRecord) => void,
) {
  const lastReportedRecordIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'success' || !record) {
      return;
    }

    if (lastReportedRecordIdRef.current === record.id) {
      return;
    }

    lastReportedRecordIdRef.current = record.id;
    onSuccess?.(record);
  }, [onSuccess, record, status]);
}
