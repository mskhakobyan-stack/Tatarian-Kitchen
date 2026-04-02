'use client';

import { IngredientForm } from '@/app/forms/ingredient.form';
import { useManagedCollection } from '@/app/forms/use-managed-collection';
import { IngredientsTable } from '@/components/UI/table/ingredients';
import type { SavedIngredient } from '@/types/ingredient-form';

interface IngredientsManagerProps {
  currentUserId: string | null;
  initialIngredients: SavedIngredient[];
}

/**
 * Объединяет форму и таблицу в один интерактивный слой, чтобы изменения в БД
 * сразу отражались в интерфейсе без дополнительной ручной синхронизации.
 */
export function IngredientsManager({
  currentUserId,
  initialIngredients,
}: IngredientsManagerProps) {
  const {
    items: ingredients,
    addOrReplaceItem,
    removeItem,
    updateItem,
  } = useManagedCollection(initialIngredients);
  const canCreateIngredients = Boolean(currentUserId);

  return (
    <div className="flex w-full flex-col gap-10">
      {!currentUserId ? (
        <p className="rounded-2xl border border-[#eadbcc] bg-[#fffdfa]/56 px-4 py-3 text-sm leading-6 text-[#8b6742]">
          Просматривать ингредиенты можно всем, а добавлять новые и
          редактировать свои — только после входа в аккаунт.
        </p>
      ) : (
        <p className="rounded-2xl border border-[#eadbcc] bg-[#fffdfa]/56 px-4 py-3 text-sm leading-6 text-[#8b6742]">
          Вы видите все ингредиенты, но редактировать и удалять можете только
          свои записи.
        </p>
      )}

      {/* Форму показываем только авторизованным пользователям. */}
      {canCreateIngredients ? (
        <IngredientForm onIngredientCreated={addOrReplaceItem} />
      ) : null}

      {/* Таблица использует тот же локальный список, поэтому изменения видны мгновенно. */}
      <IngredientsTable
        currentUserId={currentUserId}
        ingredients={ingredients}
        onIngredientDeleted={removeItem}
        onIngredientUpdated={updateItem}
      />
    </div>
  );
}
