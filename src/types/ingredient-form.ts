import type { Category, Unit } from '@/generated/prisma/enums';

/**
 * Сырые значения ингредиента держим строками, потому что именно в таком виде
 * они приходят из `FormData` в серверный action.
 */
export interface IngredientFormFields {
  category: string;
  description: string;
  name: string;
  price: string;
  unit: string;
}

export type IngredientFieldName = keyof IngredientFormFields;

/**
 * Ошибки заполняются только для проблемных полей, поэтому объект частичный.
 */
export type IngredientFormErrors = Partial<
  Record<IngredientFieldName, string[]>
>;

/**
 * Храним последнюю успешно сохранённую запись отдельно, чтобы интерфейс мог
 * показать пользователю, что именно ушло в базу.
 */
export interface SavedIngredient {
  id: string;
  category: Category;
  description: string;
  name: string;
  ownerId: string | null;
  price: number;
  unit: Unit;
}

/**
 * Состояние формы используется в `useActionState` и объединяет общий статус,
 * текст сообщения, ошибки полей и последнюю сохранённую запись.
 */
export interface IngredientFormState {
  status: 'idle' | 'success' | 'error';
  message: string;
  errors: IngredientFormErrors;
  ingredient: SavedIngredient | null;
}

export const initialIngredientFormState: IngredientFormState = {
  status: 'idle',
  message: '',
  errors: {},
  ingredient: null,
};

export interface IngredientDeleteResult {
  status: 'success' | 'error';
  message: string;
  deletedIngredientId: string | null;
}
