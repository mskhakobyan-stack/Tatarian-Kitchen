'use client';

import { useState } from 'react';

import {
  prependOrReplaceById,
  removeById,
  replaceById,
} from '@/lib/collection-state';

interface IdentifiableRecord {
  id: string;
}

/**
 * Менеджеры ингредиентов и рецептов одинаково держат локальный список записей:
 * добавление наверх, точечное обновление и удаление по id.
 */
export function useManagedCollection<TRecord extends IdentifiableRecord>(
  initialItems: TRecord[],
) {
  const [items, setItems] = useState(initialItems);

  const addOrReplaceItem = (item: TRecord) => {
    setItems((currentItems) => prependOrReplaceById(currentItems, item));
  };

  const updateItem = (item: TRecord) => {
    setItems((currentItems) => replaceById(currentItems, item));
  };

  const removeItem = (itemId: string) => {
    setItems((currentItems) => removeById(currentItems, itemId));
  };

  return {
    items,
    addOrReplaceItem,
    updateItem,
    removeItem,
  };
}
