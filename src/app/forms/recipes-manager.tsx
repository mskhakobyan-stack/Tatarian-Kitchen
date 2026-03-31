'use client';

import { useState } from 'react';

import { RecipeForm } from '@/app/forms/recipe.form';
import { RecipeCards } from '@/components/UI/cards/recipes';
import type {
  RecipeIngredientOption,
  SavedRecipe,
} from '@/types/recipe-form';

interface RecipesManagerProps {
  availableIngredients: RecipeIngredientOption[];
  canManage: boolean;
  initialRecipes: SavedRecipe[];
}

/**
 * Держит форму и карточки рецептов в одном клиентском слое, чтобы CRUD
 * моментально отражался в интерфейсе без ручной перезагрузки страницы.
 */
export function RecipesManager({
  availableIngredients = [],
  canManage,
  initialRecipes,
}: RecipesManagerProps) {
  const [recipes, setRecipes] = useState(initialRecipes);

  const handleRecipeCreated = (recipe: SavedRecipe) => {
    setRecipes((current) => {
      const withoutCreatedRecipe = current.filter((item) => item.id !== recipe.id);

      return [recipe, ...withoutCreatedRecipe];
    });
  };

  const handleRecipeUpdated = (recipe: SavedRecipe) => {
    setRecipes((current) =>
      current.map((item) => (item.id === recipe.id ? recipe : item)),
    );
  };

  const handleRecipeDeleted = (recipeId: string) => {
    setRecipes((current) => current.filter((item) => item.id !== recipeId));
  };

  return (
    <div className="flex w-full flex-col gap-10">
      {canManage ? (
        <RecipeForm
          availableIngredients={availableIngredients}
          onRecipeCreated={handleRecipeCreated}
        />
      ) : null}
      <RecipeCards
        availableIngredients={availableIngredients}
        canManage={canManage}
        onRecipeDeleted={handleRecipeDeleted}
        onRecipeUpdated={handleRecipeUpdated}
        recipes={recipes}
      />
    </div>
  );
}
