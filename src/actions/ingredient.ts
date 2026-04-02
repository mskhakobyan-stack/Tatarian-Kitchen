'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth/auth';
import { Prisma } from '@/generated/prisma/client';
import {
  normalizeStringFields,
  pickStringFormValues,
  type StringFormFieldConfig,
} from '@/lib/form-data';
import { prisma } from '@/lib/prisma';
import { ingredientSchema } from '@/schema/zod';
import type {
  IngredientDeleteResult,
  IngredientFieldName,
  IngredientFormErrors,
  IngredientFormFields,
  IngredientFormState,
  SavedIngredient,
} from '@/types/ingredient-form';

const INGREDIENT_SAVE_SUCCESS_MESSAGE = 'Ингредиент успешно добавлен.';
const INGREDIENT_UPDATE_SUCCESS_MESSAGE = 'Ингредиент успешно обновлён.';
const INGREDIENT_DELETE_SUCCESS_MESSAGE = 'Ингредиент успешно удалён.';
const INGREDIENT_SAVE_ERROR_MESSAGE =
  'Не удалось сохранить ингредиент. Попробуйте ещё раз.';
const INGREDIENT_UPDATE_ERROR_MESSAGE =
  'Не удалось обновить ингредиент. Попробуйте ещё раз.';
const INGREDIENT_DELETE_ERROR_MESSAGE =
  'Не удалось удалить ингредиент. Попробуйте ещё раз.';
const INGREDIENT_DELETE_IN_USE_MESSAGE =
  'Нельзя удалить ингредиент, пока он используется в одном или нескольких рецептах.';
const INGREDIENT_VALIDATION_ERROR_MESSAGE =
  'Проверьте данные формы и попробуйте снова.';
const INGREDIENT_UNAUTHORIZED_MESSAGE =
  'Добавлять, изменять и удалять ингредиенты могут только авторизованные пользователи.';
const INGREDIENT_FORBIDDEN_MESSAGE =
  'Редактировать и удалять можно только свои ингредиенты.';
const INGREDIENT_FORM_FIELDS = [
  { key: 'category' },
  { key: 'description' },
  { key: 'name' },
  { key: 'price' },
  { key: 'unit' },
] as const satisfies readonly StringFormFieldConfig<IngredientFieldName>[];

interface IngredientRow {
  id: string;
  category: SavedIngredient['category'];
  description: string | null;
  name: string;
  ownerId: string | null;
  price: number | null;
  unit: SavedIngredient['unit'];
}

type IngredientPersistenceInput = Pick<
  SavedIngredient,
  'category' | 'description' | 'name' | 'price' | 'unit'
>;

/**
 * Собираем сырые значения формы в объект, который затем валидирует zod.
 */
function getIngredientFormValues(formData: FormData): IngredientFormFields {
  return pickStringFormValues(formData, INGREDIENT_FORM_FIELDS);
}

/**
 * Prisma возвращает nullable-поля согласно схеме БД, а UI после нашей
 * валидации уже работает только с заполненным ингредиентом.
 */
function mapIngredientRow(row: IngredientRow): SavedIngredient {
  return {
    ...row,
    description: row.description ?? '',
    ownerId: row.ownerId ?? null,
    price: row.price ?? 0,
  };
}

/**
 * Формируем единое состояние ошибки для удобной отдачи в `useActionState`.
 */
function createErrorState(
  message: string,
  errors: IngredientFormErrors = {},
  ingredient: SavedIngredient | null = null,
): IngredientFormState {
  return {
    status: 'error',
    message,
    errors,
    ingredient,
  };
}

/**
 * Приводим ошибки zod к форме, которую удобно читать UI.
 */
function createValidationErrorState(
  errors: IngredientFormErrors,
  ingredient: SavedIngredient | null,
): IngredientFormState {
  return createErrorState(INGREDIENT_VALIDATION_ERROR_MESSAGE, {
    category: errors.category ?? [],
    description: errors.description ?? [],
    name: errors.name ?? [],
    price: errors.price ?? [],
    unit: errors.unit ?? [],
  }, ingredient);
}

function isForeignKeyConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === 'P2003'
  );
}

/**
 * Проверяем сессию внутри каждого server action: одной защиты страницы
 * недостаточно, потому что action можно вызвать и напрямую.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth();

  return typeof session?.user?.id === 'string' ? session.user.id : null;
}

/**
 * Сохраняем ингредиент через Prisma и сразу возвращаем минимальный набор полей
 * для подтверждения успешной записи в интерфейсе.
 */
async function insertIngredient(
  data: IngredientPersistenceInput,
  ownerId: string,
): Promise<SavedIngredient> {
  const ingredient = await prisma.ingredient.create({
    data: {
      ...data,
      owner: {
        connect: {
          id: ownerId,
        },
      },
    },
    select: {
      id: true,
      category: true,
      description: true,
      name: true,
      ownerId: true,
      price: true,
      unit: true,
    },
  });

  return mapIngredientRow(ingredient);
}

/**
 * Обновляем запись и возвращаем тот же набор полей, который уже использует UI.
 */
async function persistIngredientUpdate(
  id: string,
  data: IngredientPersistenceInput,
): Promise<SavedIngredient> {
  const ingredient = await prisma.ingredient.update({
    where: { id },
    data,
    select: {
      id: true,
      category: true,
      description: true,
      name: true,
      ownerId: true,
      price: true,
      unit: true,
    },
  });

  return mapIngredientRow(ingredient);
}

/**
 * Серверный action валидирует ингредиент и записывает его в таблицу
 * `ingredients`, чтобы после отправки форма работала не только локально.
 */
export async function createIngredient(
  prevState: IngredientFormState,
  formData: FormData,
): Promise<IngredientFormState> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return createErrorState(
      INGREDIENT_UNAUTHORIZED_MESSAGE,
      {},
      prevState.ingredient,
    );
  }

  const result = await ingredientSchema.safeParseAsync(
    getIngredientFormValues(formData),
  );

  if (!result.success) {
    return createValidationErrorState(
      result.error.flatten().fieldErrors,
      prevState.ingredient,
    );
  }

  try {
    const ingredient = await insertIngredient(result.data, userId);
    revalidatePath('/ingredients');

    return {
      status: 'success',
      message: `${INGREDIENT_SAVE_SUCCESS_MESSAGE} «${ingredient.name}».`,
      errors: {},
      ingredient,
    };
  } catch (error) {
    console.error('Failed to save ingredient', error);

    return createErrorState(
      INGREDIENT_SAVE_ERROR_MESSAGE,
      {},
      prevState.ingredient,
    );
  }
}

/**
 * Серверный action для редактирования ингредиента использует ту же zod-схему,
 * чтобы форма создания и модалка редактирования вели себя одинаково.
 */
export async function updateIngredient(
  id: string,
  fields: IngredientFormFields,
): Promise<IngredientFormState> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return createErrorState(INGREDIENT_UNAUTHORIZED_MESSAGE);
  }

  const result = await ingredientSchema.safeParseAsync(
    normalizeStringFields(fields),
  );

  if (!result.success) {
    return createValidationErrorState(result.error.flatten().fieldErrors, null);
  }

  const existingIngredient = await prisma.ingredient.findUnique({
    where: { id },
    select: {
      ownerId: true,
    },
  });

  if (!existingIngredient) {
    return createErrorState(INGREDIENT_UPDATE_ERROR_MESSAGE);
  }

  if (existingIngredient.ownerId !== userId) {
    return createErrorState(INGREDIENT_FORBIDDEN_MESSAGE);
  }

  try {
    const ingredient = await persistIngredientUpdate(id, result.data);
    revalidatePath('/ingredients');

    return {
      status: 'success',
      message: `${INGREDIENT_UPDATE_SUCCESS_MESSAGE} «${ingredient.name}».`,
      errors: {},
      ingredient,
    };
  } catch (error) {
    console.error('Failed to update ingredient', error);

    return createErrorState(INGREDIENT_UPDATE_ERROR_MESSAGE);
  }
}

/**
 * Удаляем ингредиент по id и сообщаем клиенту, какую строку нужно убрать из UI.
 */
export async function deleteIngredient(
  id: string,
): Promise<IngredientDeleteResult> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      status: 'error',
      message: INGREDIENT_UNAUTHORIZED_MESSAGE,
      deletedIngredientId: null,
    };
  }

  const existingIngredient = await prisma.ingredient.findUnique({
    where: { id },
    select: {
      ownerId: true,
    },
  });

  if (!existingIngredient) {
    return {
      status: 'error',
      message: INGREDIENT_DELETE_ERROR_MESSAGE,
      deletedIngredientId: null,
    };
  }

  if (existingIngredient.ownerId !== userId) {
    return {
      status: 'error',
      message: INGREDIENT_FORBIDDEN_MESSAGE,
      deletedIngredientId: null,
    };
  }

  try {
    await prisma.ingredient.delete({
      where: { id },
    });
    revalidatePath('/ingredients');

    return {
      status: 'success',
      message: INGREDIENT_DELETE_SUCCESS_MESSAGE,
      deletedIngredientId: id,
    };
  } catch (error) {
    console.error('Failed to delete ingredient', error);

    if (isForeignKeyConstraintError(error)) {
      return {
        status: 'error',
        message: INGREDIENT_DELETE_IN_USE_MESSAGE,
        deletedIngredientId: null,
      };
    }

    return {
      status: 'error',
      message: INGREDIENT_DELETE_ERROR_MESSAGE,
      deletedIngredientId: null,
    };
  }
}
