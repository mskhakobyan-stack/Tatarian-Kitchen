'use client';

import { RecipesManager } from './recipes-manager';

import type {
  RecipeIngredientOption,
  SavedRecipe,
} from '@/types/recipe-form';

interface RecipeFormShellProps {
  availableIngredients: RecipeIngredientOption[];
  currentUserId: string | null;
  initialRecipes: SavedRecipe[];
}

export function RecipeFormShell({
  availableIngredients = [],
  currentUserId,
  initialRecipes,
}: RecipeFormShellProps) {
  return (
    <RecipesManager
      availableIngredients={availableIngredients}
      currentUserId={currentUserId}
      initialRecipes={initialRecipes}
    />
  );
}
