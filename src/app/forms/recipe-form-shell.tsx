'use client';

import { RecipesManager } from './recipes-manager';

import type {
  RecipeIngredientOption,
  SavedRecipe,
} from '@/types/recipe-form';

interface RecipeFormShellProps {
  availableIngredients: RecipeIngredientOption[];
  canManage: boolean;
  initialRecipes: SavedRecipe[];
}

export function RecipeFormShell({
  availableIngredients = [],
  canManage,
  initialRecipes,
}: RecipeFormShellProps) {
  return (
    <RecipesManager
      availableIngredients={availableIngredients}
      canManage={canManage}
      initialRecipes={initialRecipes}
    />
  );
}
