'use server';

import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth/auth';
import {
  getFileFormValue,
  pickStringFormValues,
  type StringFormFieldConfig,
} from '@/lib/form-data';
import { prisma } from '@/lib/prisma';
import {
  RECIPE_UPLOAD_PUBLIC_PATH,
  isRecipeFileSourceImage,
  isUploadedRecipeImage,
} from '@/lib/recipe-images';
import {
  allRecipeIngredientIdsExist,
  createRecipeRecord,
  deleteRecipeRecord,
  updateRecipeRecord,
} from '@/lib/recipe-records';
import { recipeSchema } from '@/schema/zod';
import type {
  RecipeDeleteResult,
  RecipeFieldName,
  RecipeFormErrors,
  RecipeFormFields,
  RecipeFormState,
  RecipeImageSource,
  RecipeIngredientDraft,
  RecipeIngredientInput,
  SavedRecipe,
} from '@/types/recipe-form';

/**
 * Блок констант держим наверху, чтобы внизу action-логика читалась как сценарий,
 * а не как смесь бизнес-правил, сообщений и технических деталей.
 */
const RECIPE_UPLOAD_DIRECTORY = join(
  process.cwd(),
  'public',
  'uploads',
  'recipes',
);
const RECIPE_SAVE_SUCCESS_MESSAGE = 'Рецепт успешно добавлен.';
const RECIPE_UPDATE_SUCCESS_MESSAGE = 'Рецепт успешно обновлён.';
const RECIPE_DELETE_SUCCESS_MESSAGE = 'Рецепт успешно удалён.';
const RECIPE_SAVE_ERROR_MESSAGE =
  'Не удалось сохранить рецепт. Попробуйте ещё раз.';
const RECIPE_UPDATE_ERROR_MESSAGE =
  'Не удалось обновить рецепт. Попробуйте ещё раз.';
const RECIPE_DELETE_ERROR_MESSAGE =
  'Не удалось удалить рецепт. Попробуйте ещё раз.';
const RECIPE_FORBIDDEN_MESSAGE =
  'Редактировать и удалять можно только свои рецепты.';
const RECIPE_VALIDATION_ERROR_MESSAGE =
  'Проверьте данные формы и попробуйте снова.';
const RECIPE_UNAUTHORIZED_MESSAGE =
  'Добавлять, изменять и удалять рецепты могут только авторизованные пользователи.';
const RECIPE_IMAGE_REQUIRED_MESSAGE =
  'Добавьте изображение по ссылке или загрузите файл.';
const RECIPE_FILE_REQUIRED_MESSAGE = 'Выберите файл изображения.';
const RECIPE_URL_REQUIRED_MESSAGE = 'Добавьте ссылку на изображение.';
const RECIPE_INVALID_URL_MESSAGE = 'Введите корректную ссылку на изображение.';
const RECIPE_INVALID_FILE_TYPE_MESSAGE =
  'Поддерживаются только JPG, PNG, WEBP или GIF.';
const RECIPE_FILE_TOO_LARGE_MESSAGE =
  'Файл изображения не должен превышать 5 МБ.';
const RECIPE_INGREDIENTS_REQUIRED_MESSAGE =
  'Добавьте хотя бы один ингредиент в состав рецепта.';
const RECIPE_INGREDIENTS_INVALID_MESSAGE =
  'Не удалось прочитать состав рецепта. Обновите страницу и попробуйте снова.';
const RECIPE_INGREDIENT_DUPLICATE_MESSAGE =
  'Один и тот же ингредиент нельзя добавить дважды.';
const RECIPE_INGREDIENT_MISSING_MESSAGE =
  'Выберите ингредиент для каждой строки состава.';
const RECIPE_INGREDIENT_NOT_FOUND_MESSAGE =
  'Один или несколько ингредиентов больше недоступны. Обновите страницу.';
const RECIPE_INGREDIENT_QUANTITY_REQUIRED_MESSAGE =
  'Укажите количество для каждого ингредиента.';
const RECIPE_INGREDIENT_QUANTITY_INVALID_MESSAGE =
  'Количество должно быть числом больше нуля.';
const MAX_RECIPE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_RECIPE_IMAGE_TYPES = new Set([
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const RECIPE_FORM_FIELDS = [
  { key: 'currentImageUrl' },
  { key: 'description' },
  { key: 'ingredientsPayload' },
  { key: 'imageSource' },
  { key: 'imageUrl' },
  { key: 'name' },
] as const satisfies readonly StringFormFieldConfig<RecipeFieldName>[];

interface RecipeImageResolution {
  imageUrl: string;
  oldUploadedImageToDelete: string | null;
}

interface RecipeImageValidationResult {
  errors: RecipeFormErrors;
  resolvedImage: RecipeImageResolution | null;
}

/**
 * Собираем `FormData` декларативно, чтобы все recipe-actions использовали
 * одинаковые правила чтения строковых полей.
 */
function getRecipeFormValues(formData: FormData): RecipeFormFields {
  return pickStringFormValues(formData, RECIPE_FORM_FIELDS);
}

/**
 * Общее error-state упрощает интеграцию с `useActionState` и гарантирует,
 * что интерфейс всегда получит однотипный ответ.
 */
function createErrorState(
  message: string,
  errors: RecipeFormErrors = {},
  recipe: SavedRecipe | null = null,
): RecipeFormState {
  return {
    status: 'error',
    message,
    errors,
    recipe,
  };
}

/**
 * Ошибки zod и наши дополнительные recipe-check-и приводим к одному shape,
 * чтобы UI не интересовало их происхождение.
 */
function createValidationErrorState(
  errors: RecipeFormErrors,
  recipe: SavedRecipe | null,
): RecipeFormState {
  return createErrorState(
    RECIPE_VALIDATION_ERROR_MESSAGE,
    {
      currentImageUrl: errors.currentImageUrl ?? [],
      description: errors.description ?? [],
      imageFile: errors.imageFile ?? [],
      imageSource: errors.imageSource ?? [],
      imageUrl: errors.imageUrl ?? [],
      ingredientsPayload: errors.ingredientsPayload ?? [],
      name: errors.name ?? [],
    },
    recipe,
  );
}

/**
 * Повторная проверка прав внутри каждого action защищает приложение
 * от прямых POST-запросов мимо клиентского интерфейса.
 */
function getAuthenticatedUserId(
  session: { user?: { id?: string | null } | null } | null,
): string | null {
  return typeof session?.user?.id === 'string' ? session.user.id : null;
}

/**
 * UI передаёт source строкой, а на сервере нам удобнее работать
 * с маленьким объединением литеральных значений.
 */
function getImageSource(value: string): RecipeImageSource {
  return value === 'file' ? 'file' : 'url';
}

/**
 * Валидацию URL держим простой и явной: нам подходят только абсолютные http/https-ссылки.
 */
function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * При загрузке файла стараемся сохранить расширение из имени файла,
 * а если его нет, аккуратно восстанавливаем по MIME-type.
 */
function getFileExtension(file: File): string {
  const originalExtension = extname(file.name).toLowerCase();

  if (originalExtension) {
    return originalExtension;
  }

  if (file.type === 'image/png') {
    return '.png';
  }

  if (file.type === 'image/webp') {
    return '.webp';
  }

  if (file.type === 'image/gif') {
    return '.gif';
  }

  return '.jpg';
}

/**
 * Количество приходит строкой из формы, но в БД и расчётах нам нужно число.
 */
function parseQuantity(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

/**
 * Ингредиенты отправляются как JSON-строка, поэтому сначала мягко парсим её
 * и сразу нормализуем до контролируемого чернового вида.
 */
function parseRecipeIngredientsPayload(
  payload: string,
): RecipeIngredientDraft[] | null {
  if (!payload) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(payload);

    if (!Array.isArray(parsedValue)) {
      return null;
    }

    return parsedValue.map((item) => ({
      ingredientId:
        item && typeof item.ingredientId === 'string'
          ? item.ingredientId.trim()
          : '',
      quantity:
        item
        && (
          typeof item.quantity === 'number'
          || typeof item.quantity === 'string'
        )
          ? String(item.quantity).trim()
          : '',
    }));
  } catch {
    return null;
  }
}

/**
 * Отдельный validator закрывает сразу несколько рисков:
 * пустые строки, дубли, неправильный формат количества и устаревшие `ingredientId`.
 */
async function validateRecipeIngredients(
  payload: string,
): Promise<{
  errors: RecipeFormErrors;
  ingredients: RecipeIngredientInput[] | null;
}> {
  const draftIngredients = parseRecipeIngredientsPayload(payload);

  if (!draftIngredients) {
    return {
      ingredients: null,
      errors: {
        ingredientsPayload: [RECIPE_INGREDIENTS_INVALID_MESSAGE],
      },
    };
  }

  if (!draftIngredients.length) {
    return {
      ingredients: null,
      errors: {
        ingredientsPayload: [RECIPE_INGREDIENTS_REQUIRED_MESSAGE],
      },
    };
  }

  const seenIngredientIds = new Set<string>();
  const normalizedIngredients: RecipeIngredientInput[] = [];

  for (const draftIngredient of draftIngredients) {
    if (!draftIngredient.ingredientId) {
      return {
        ingredients: null,
        errors: {
          ingredientsPayload: [RECIPE_INGREDIENT_MISSING_MESSAGE],
        },
      };
    }

    if (seenIngredientIds.has(draftIngredient.ingredientId)) {
      return {
        ingredients: null,
        errors: {
          ingredientsPayload: [RECIPE_INGREDIENT_DUPLICATE_MESSAGE],
        },
      };
    }

    if (!draftIngredient.quantity) {
      return {
        ingredients: null,
        errors: {
          ingredientsPayload: [RECIPE_INGREDIENT_QUANTITY_REQUIRED_MESSAGE],
        },
      };
    }

    const quantity = parseQuantity(draftIngredient.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return {
        ingredients: null,
        errors: {
          ingredientsPayload: [RECIPE_INGREDIENT_QUANTITY_INVALID_MESSAGE],
        },
      };
    }

    seenIngredientIds.add(draftIngredient.ingredientId);
    normalizedIngredients.push({
      ingredientId: draftIngredient.ingredientId,
      quantity,
    });
  }

  const ingredientIds = normalizedIngredients.map(
    (ingredient) => ingredient.ingredientId,
  );
  const allIngredientsExist = await allRecipeIngredientIdsExist(
    prisma,
    ingredientIds,
  );

  if (!allIngredientsExist) {
    return {
      ingredients: null,
      errors: {
        ingredientsPayload: [RECIPE_INGREDIENT_NOT_FOUND_MESSAGE],
      },
    };
  }

  return {
    ingredients: normalizedIngredients,
    errors: {},
  };
}

/**
 * Загруженное изображение сохраняем в `public/uploads/recipes`,
 * а на read-only деплоях мягко переключаемся на inline data URL,
 * чтобы upload не ломал страницу целиком.
 */
async function saveRecipeImage(file: File): Promise<string> {
  const extension = getFileExtension(file);
  const fileName = `${randomUUID()}${extension}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  try {
    await mkdir(RECIPE_UPLOAD_DIRECTORY, { recursive: true });
    await writeFile(join(RECIPE_UPLOAD_DIRECTORY, fileName), fileBuffer);

    return `${RECIPE_UPLOAD_PUBLIC_PATH}/${fileName}`;
  } catch (error) {
    console.error(
      'Failed to store recipe image on filesystem, falling back to inline image',
      error,
    );

    return `data:${file.type};base64,${fileBuffer.toString('base64')}`;
  }
}

/**
 * Удаляем только наши локально загруженные файлы и молча игнорируем ситуацию,
 * когда файл уже исчез вручную.
 */
async function deleteUploadedRecipeImage(imageUrl: string | null): Promise<void> {
  if (!isUploadedRecipeImage(imageUrl)) {
    return;
  }

  const safeImageUrl = imageUrl ?? '';
  const relativeFilePath = safeImageUrl.slice(
    RECIPE_UPLOAD_PUBLIC_PATH.length + 1,
  );

  if (!relativeFilePath) {
    return;
  }

  try {
    await unlink(join(RECIPE_UPLOAD_DIRECTORY, relativeFilePath));
  } catch {
    // Файл могли удалить вручную вне приложения — CRUD не должен из-за этого падать.
  }
}

/**
 * Здесь сходятся обе стратегии работы с картинкой:
 * ссылка, новый файл или сохранение уже существующего uploaded-файла.
 */
async function resolveRecipeImage(
  values: RecipeFormFields,
  imageFile: File | null,
): Promise<RecipeImageValidationResult> {
  const imageSource = getImageSource(values.imageSource);
  const currentImageUrl = values.currentImageUrl;

  if (imageSource === 'url') {
    const nextImageUrl =
      values.imageUrl
      || (!isRecipeFileSourceImage(currentImageUrl) ? currentImageUrl : '');

    if (!nextImageUrl) {
      return {
        resolvedImage: null,
        errors: {
          imageUrl: [
            currentImageUrl
              ? RECIPE_URL_REQUIRED_MESSAGE
              : RECIPE_IMAGE_REQUIRED_MESSAGE,
          ],
        },
      };
    }

    if (!isValidUrl(nextImageUrl)) {
      return {
        resolvedImage: null,
        errors: {
          imageUrl: [RECIPE_INVALID_URL_MESSAGE],
        },
      };
    }

    return {
      resolvedImage: {
        imageUrl: nextImageUrl,
        oldUploadedImageToDelete:
          isUploadedRecipeImage(currentImageUrl) && currentImageUrl !== nextImageUrl
            ? currentImageUrl
            : null,
      },
      errors: {},
    };
  }

  if (!imageFile || imageFile.size === 0) {
    if (isRecipeFileSourceImage(currentImageUrl)) {
      return {
        resolvedImage: {
          imageUrl: currentImageUrl,
          oldUploadedImageToDelete: null,
        },
        errors: {},
      };
    }

    return {
      resolvedImage: null,
      errors: {
        imageFile: [
          currentImageUrl
            ? RECIPE_FILE_REQUIRED_MESSAGE
            : RECIPE_IMAGE_REQUIRED_MESSAGE,
        ],
      },
    };
  }

  if (!ALLOWED_RECIPE_IMAGE_TYPES.has(imageFile.type)) {
    return {
      resolvedImage: null,
      errors: {
        imageFile: [RECIPE_INVALID_FILE_TYPE_MESSAGE],
      },
    };
  }

  if (imageFile.size > MAX_RECIPE_IMAGE_SIZE) {
    return {
      resolvedImage: null,
      errors: {
        imageFile: [RECIPE_FILE_TOO_LARGE_MESSAGE],
      },
    };
  }

  return {
    resolvedImage: {
      imageUrl: await saveRecipeImage(imageFile),
      oldUploadedImageToDelete: isUploadedRecipeImage(currentImageUrl)
        ? currentImageUrl
        : null,
    },
    errors: {},
  };
}

/**
 * Создание рецепта теперь оркестрирует только верхнеуровневые шаги:
 * auth, валидацию, работу с картинкой, транзакцию и cleanup.
 */
export async function createRecipe(
  prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const session = await auth();
  const userId = getAuthenticatedUserId(session);

  if (!userId) {
    return createErrorState(RECIPE_UNAUTHORIZED_MESSAGE, {}, prevState.recipe);
  }

  const values = getRecipeFormValues(formData);
  const parsedValues = await recipeSchema.safeParseAsync(values);

  if (!parsedValues.success) {
    return createValidationErrorState(
      parsedValues.error.flatten().fieldErrors,
      prevState.recipe,
    );
  }

  const validatedIngredients = await validateRecipeIngredients(
    parsedValues.data.ingredientsPayload,
  );

  if (!validatedIngredients.ingredients) {
    return createValidationErrorState(
      validatedIngredients.errors,
      prevState.recipe,
    );
  }

  const imageResult = await resolveRecipeImage(
    parsedValues.data,
    getFileFormValue(formData, 'imageFile'),
  );

  if (!imageResult.resolvedImage) {
    return createValidationErrorState(imageResult.errors, prevState.recipe);
  }

  try {
    const recipe = await prisma.$transaction((transaction) =>
      createRecipeRecord(transaction, {
        name: parsedValues.data.name,
        description: parsedValues.data.description,
        imageUrl: imageResult.resolvedImage!.imageUrl,
        ingredients: validatedIngredients.ingredients!,
        ownerId: userId,
      }),
    );

    await deleteUploadedRecipeImage(
      imageResult.resolvedImage.oldUploadedImageToDelete,
    );
    revalidatePath('/recipes');

    return {
      status: 'success',
      message: `${RECIPE_SAVE_SUCCESS_MESSAGE} «${recipe.name}».`,
      errors: {},
      recipe,
    };
  } catch (error) {
    console.error('Failed to save recipe', error);

    await deleteUploadedRecipeImage(imageResult.resolvedImage.imageUrl);

    return createErrorState(RECIPE_SAVE_ERROR_MESSAGE, {}, prevState.recipe);
  }
}

/**
 * Обновление использует тот же pipeline, что и создание, но отдельно
 * чистит новые загруженные файлы, если запись не удалось изменить.
 */
export async function updateRecipe(
  id: string,
  formData: FormData,
): Promise<RecipeFormState> {
  const session = await auth();
  const userId = getAuthenticatedUserId(session);

  if (!userId) {
    return createErrorState(RECIPE_UNAUTHORIZED_MESSAGE);
  }

  const values = getRecipeFormValues(formData);
  const parsedValues = await recipeSchema.safeParseAsync(values);

  if (!parsedValues.success) {
    return createValidationErrorState(
      parsedValues.error.flatten().fieldErrors,
      null,
    );
  }

  const validatedIngredients = await validateRecipeIngredients(
    parsedValues.data.ingredientsPayload,
  );

  if (!validatedIngredients.ingredients) {
    return createValidationErrorState(validatedIngredients.errors, null);
  }

  const currentRecipe = await prisma.recipe.findUnique({
    where: { id },
    select: {
      imageUrl: true,
      ownerId: true,
    },
  });

  if (!currentRecipe) {
    return createErrorState(RECIPE_UPDATE_ERROR_MESSAGE);
  }

  if (currentRecipe.ownerId !== userId) {
    return createErrorState(RECIPE_FORBIDDEN_MESSAGE);
  }

  const currentImageUrl = currentRecipe.imageUrl ?? '';
  const imageResult = await resolveRecipeImage(
    {
      ...parsedValues.data,
      currentImageUrl,
    },
    getFileFormValue(formData, 'imageFile'),
  );

  if (!imageResult.resolvedImage) {
    return createValidationErrorState(imageResult.errors, null);
  }

  try {
    const recipe = await prisma.$transaction((transaction) =>
      updateRecipeRecord(transaction, id, {
        name: parsedValues.data.name,
        description: parsedValues.data.description,
        imageUrl: imageResult.resolvedImage!.imageUrl,
        ingredients: validatedIngredients.ingredients!,
      }),
    );

    if (!recipe) {
      if (imageResult.resolvedImage.imageUrl !== currentImageUrl) {
        await deleteUploadedRecipeImage(imageResult.resolvedImage.imageUrl);
      }

      return createErrorState(RECIPE_UPDATE_ERROR_MESSAGE);
    }

    await deleteUploadedRecipeImage(
      imageResult.resolvedImage.oldUploadedImageToDelete,
    );
    revalidatePath('/recipes');

    return {
      status: 'success',
      message: `${RECIPE_UPDATE_SUCCESS_MESSAGE} «${recipe.name}».`,
      errors: {},
      recipe,
    };
  } catch (error) {
    console.error('Failed to update recipe', error);

    if (imageResult.resolvedImage.imageUrl !== currentImageUrl) {
      await deleteUploadedRecipeImage(imageResult.resolvedImage.imageUrl);
    }

    return createErrorState(RECIPE_UPDATE_ERROR_MESSAGE);
  }
}

/**
 * При удалении сначала удаляем состав, затем сам рецепт, а уже после коммита
 * чистим загруженное изображение и инвалидируем страницу.
 */
export async function deleteRecipe(
  id: string,
): Promise<RecipeDeleteResult> {
  const session = await auth();
  const userId = getAuthenticatedUserId(session);

  if (!userId) {
    return {
      status: 'error',
      message: RECIPE_UNAUTHORIZED_MESSAGE,
      deletedRecipeId: null,
    };
  }

  const existingRecipe = await prisma.recipe.findUnique({
    where: { id },
    select: {
      ownerId: true,
    },
  });

  if (!existingRecipe) {
    return {
      status: 'error',
      message: RECIPE_DELETE_ERROR_MESSAGE,
      deletedRecipeId: null,
    };
  }

  if (existingRecipe.ownerId !== userId) {
    return {
      status: 'error',
      message: RECIPE_FORBIDDEN_MESSAGE,
      deletedRecipeId: null,
    };
  }

  try {
    const deletedRecipe = await prisma.$transaction((transaction) =>
      deleteRecipeRecord(transaction, id),
    );

    if (!deletedRecipe) {
      return {
        status: 'error',
        message: RECIPE_DELETE_ERROR_MESSAGE,
        deletedRecipeId: null,
      };
    }

    await deleteUploadedRecipeImage(deletedRecipe.imageUrl);
    revalidatePath('/recipes');

    return {
      status: 'success',
      message: RECIPE_DELETE_SUCCESS_MESSAGE,
      deletedRecipeId: deletedRecipe.id,
    };
  } catch (error) {
    console.error('Failed to delete recipe', error);

    return {
      status: 'error',
      message: RECIPE_DELETE_ERROR_MESSAGE,
      deletedRecipeId: null,
    };
  }
}
