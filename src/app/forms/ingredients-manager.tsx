'use client';

import { useState } from 'react';

import { IngredientForm } from '@/app/forms/ingredient.form';
import { IngredientsTable } from '@/components/UI/table/ingredients';
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
  const [ingredients, setIngredients] = useState(initialIngredients);

  const handleIngredientCreated = (ingredient: SavedIngredient) => {
    setIngredients((current) => {
      const withoutCreatedIngredient = current.filter(
        (item) => item.id !== ingredient.id,
      );

      return [ingredient, ...withoutCreatedIngredient];
    });
  };

  const handleIngredientUpdated = (ingredient: SavedIngredient) => {
    setIngredients((current) =>
      current.map((item) => (item.id === ingredient.id ? ingredient : item)),
    );
  };

  const handleIngredientDeleted = (ingredientId: string) => {
    setIngredients((current) =>
      current.filter((item) => item.id !== ingredientId),
    );
  };

  return (
    <div className="flex w-full flex-col gap-10">
      <IngredientForm onIngredientCreated={handleIngredientCreated} />
      <IngredientsTable
        ingredients={ingredients}
        onIngredientDeleted={handleIngredientDeleted}
        onIngredientUpdated={handleIngredientUpdated}
      />
    </div>
  );
}
