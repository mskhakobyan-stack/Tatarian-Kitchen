import { isRecipeFileSourceImage } from '@/lib/recipe-images';
import {
  createEmptyRecipeIngredientDraft,
  type RecipeImageSource,
  type RecipeIngredientDraft,
  type SavedRecipe,
} from '@/types/recipe-form';

/**
 * Короткие валидаторы держим рядом и переиспользуем и в форме создания,
 * и в форме редактирования рецепта.
 */
export function validateRecipeName(value: string): string | null {
  if (!value.trim()) {
    return 'Название рецепта обязательно';
  }

  return null;
}

/**
 * Описание проверяем на заполненность и минимальную длину,
 * чтобы карточки рецептов не оказывались пустыми.
 */
export function validateRecipeDescription(value: string): string | null {
  if (!value.trim()) {
    return 'Добавьте описание рецепта';
  }

  if (value.trim().length < 20) {
    return 'Описание должно содержать минимум 20 символов';
  }

  return null;
}

/**
 * Ссылку валидируем на клиенте для более быстрых подсказок до серверной проверки.
 */
export function validateRecipeImageUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Добавьте ссылку на изображение';
  }

  try {
    const url = new URL(trimmedValue);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'Ссылка должна начинаться с http:// или https://';
    }
  } catch {
    return 'Введите корректную ссылку';
  }

  return null;
}

/**
 * Для загруженных файлов редактор стартует в file-режиме, а для внешних ссылок
 * сразу показывает поле URL.
 */
export function getRecipeImageSource(recipe: SavedRecipe): RecipeImageSource {
  return isRecipeFileSourceImage(recipe.imageUrl) ? 'file' : 'url';
}

/**
 * UI хранит ингредиенты в черновом string-формате, поэтому при открытии
 * редактора переводим сохранённый рецепт обратно в форму.
 */
export function createRecipeIngredientDrafts(
  recipe: SavedRecipe,
): RecipeIngredientDraft[] {
  if (!recipe.ingredients.length) {
    return [createEmptyRecipeIngredientDraft()];
  }

  return recipe.ingredients.map((ingredient) => ({
    ingredientId: ingredient.ingredientId,
    quantity: ingredient.quantity.toString(),
  }));
}
