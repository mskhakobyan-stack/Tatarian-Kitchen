'use client';

import { useState } from 'react';

import { IngredientForm } from '@/app/forms/ingredient.form';
import { IngredientsTable } from '@/components/UI/table/ingredients';
import {
  prependOrReplaceById,
  removeById,
  replaceById,
} from '@/lib/collection-state';
import type { SavedIngredient } from '@/types/ingredient-form';

interface IngredientsManagerProps {
  initialIngredients: SavedIngredient[];
}

/**
 * Объединяет форму и таблицу в один интерактивный слой, чтобы изменения в БД
 * сразу отражались в интерфейсе без дополнительной ручной синхронизации.
 */
export function IngredientsManager({
  initialIngredients,
}: IngredientsManagerProps) {
  /**
   * В менеджере ингредиентов нам достаточно хранить только актуальный список:
   * все server action уже возвращают полные данные изменённой записи.
   */
  const [ingredients, setIngredients] = useState(initialIngredients);

  const handleIngredientCreated = (ingredient: SavedIngredient) => {
    setIngredients((current) => prependOrReplaceById(current, ingredient));
  };

  const handleIngredientUpdated = (ingredient: SavedIngredient) => {
    setIngredients((current) => replaceById(current, ingredient));
  };

  const handleIngredientDeleted = (ingredientId: string) => {
    setIngredients((current) => removeById(current, ingredientId));
  };

  return (
    <div className="flex w-full flex-col gap-10">
      {/* Форма всегда идёт первой, чтобы пользователь мог сразу добавлять новые позиции в базу. */}
      <IngredientForm onIngredientCreated={handleIngredientCreated} />

      {/* Таблица использует тот же локальный список, поэтому изменения видны мгновенно. */}
      <IngredientsTable
        ingredients={ingredients}
        onIngredientDeleted={handleIngredientDeleted}
        onIngredientUpdated={handleIngredientUpdated}
      />
    </div>
  );
}
