import type { Unit } from '@/generated/prisma/enums';

/**
 * Строковые поля приходят из FormData, поэтому держим их в сыром виде
 * до серверной нормализации и валидации.
 */
export interface RecipeFormFields {
  currentImageUrl: string;
  description: string;
  ingredientsPayload: string;
  imageSource: string;
  imageUrl: string;
  name: string;
}

export type RecipeFieldName = keyof RecipeFormFields;

export type RecipeImageSource = 'file' | 'url';

export type RecipeFormErrors = Partial<
  Record<
    RecipeFieldName | 'imageFile',
    string[]
  >
>;

export interface RecipeIngredientDraft {
  ingredientId: string;
  quantity: string;
}

export interface RecipeIngredientInput {
  ingredientId: string;
  quantity: number;
}

export interface RecipeIngredientOption {
  id: string;
  name: string;
  unit: Unit;
}

export interface SavedRecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: Unit;
}

export interface SavedRecipe {
  description: string;
  id: string;
  imageUrl: string;
  ingredients: SavedRecipeIngredient[];
  name: string;
  ownerId: string | null;
}

export interface RecipeFormState {
  errors: RecipeFormErrors;
  message: string;
  recipe: SavedRecipe | null;
  status: 'idle' | 'success' | 'error';
}

export interface RecipeDeleteResult {
  deletedRecipeId: string | null;
  message: string;
  status: 'success' | 'error';
}

export const initialRecipeFormState: RecipeFormState = {
  status: 'idle',
  message: '',
  errors: {},
  recipe: null,
};

export function createEmptyRecipeIngredientDraft(): RecipeIngredientDraft {
  return {
    ingredientId: '',
    quantity: '',
  };
}
