'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';

import { RecipeForm } from '@/app/forms/recipe.form';
import {
  filledButtonClassName,
  softButtonClassName,
} from '@/components/UI/ui-theme';
import { RecipeCards } from '@/components/UI/cards/recipes';
import {
  prependOrReplaceById,
  removeById,
  replaceById,
} from '@/lib/collection-state';
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
  /**
   * Менеджер хранит только высокоуровневое состояние экрана:
   * список рецептов и открыт ли блок создания новой карточки.
   */
  const [recipes, setRecipes] = useState(initialRecipes);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(
    initialRecipes.length === 0,
  );
  const createFormRef = useRef<HTMLDivElement | null>(null);
  const shouldShowCreateForm = isCreateFormOpen || recipes.length === 0;

  /**
   * Когда пользователь добавляет рецепт из нижней части страницы,
   * мягко прокручиваем экран к форме, чтобы не терялся контекст.
   */
  useEffect(() => {
    if (!shouldShowCreateForm || !recipes.length) {
      return;
    }

    createFormRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [recipes.length, shouldShowCreateForm]);

  const handleRecipeCreated = (recipe: SavedRecipe) => {
    setRecipes((current) => prependOrReplaceById(current, recipe));
    setIsCreateFormOpen(false);
  };

  const handleRecipeUpdated = (recipe: SavedRecipe) => {
    setRecipes((current) => replaceById(current, recipe));
  };

  const handleRecipeDeleted = (recipeId: string) => {
    setRecipes((current) => removeById(current, recipeId));
  };

  return (
    <div className="flex w-full flex-col gap-10">
      {/* Верхняя панель нужна только когда уже есть рецепты и доступно создание новых. */}
      {canManage && recipes.length ? (
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              className={filledButtonClassName}
              onPress={() => setIsCreateFormOpen(true)}
            >
              Добавить рецепт
            </Button>
            {shouldShowCreateForm ? (
              <Button
                className={softButtonClassName}
                onPress={() => setIsCreateFormOpen(false)}
                variant="secondary"
              >
                Скрыть форму
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Форму создания показываем по кнопке или сразу, если база рецептов пока пустая. */}
      {canManage && shouldShowCreateForm ? (
        <div ref={createFormRef}>
          <RecipeForm
            availableIngredients={availableIngredients}
            onRecipeCreated={handleRecipeCreated}
          />
        </div>
      ) : null}

      {/* Список карточек рендерится всегда: он доступен и авторизованным, и гостям. */}
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
