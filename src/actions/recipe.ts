'use server';

import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth/auth';
import { Prisma } from '@/generated/prisma/client';
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
  SavedRecipeIngredient,
} from '@/types/recipe-form';
import { RECIPE_UPLOAD_PUBLIC_PATH, isUploadedRecipeImage } from '@/lib/recipe-images';
import { prisma } from '@/lib/prisma';
import { recipeSchema } from '@/schema/zod';

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
const RECIPE_VALIDATION_ERROR_MESSAGE =
  'Проверьте данные формы и попробуйте снова.';
const RECIPE_UNAUTHORIZED_MESSAGE =
  'Добавлять и изменять рецепты могут только авторизованные пользователи.';
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

interface RecipeRow {
  description: string | null;
  id: string;
  image_url: string | null;
  name: string;
}

interface RecipeIngredientRow {
  ingredient_id: string;
  ingredient_name: string;
  quantity: number;
  recipe_id: string;
  unit: SavedRecipeIngredient['unit'];
}

interface RecipeImageResolution {
  imageUrl: string;
  oldUploadedImageToDelete: string | null;
}

interface RecipeImageValidationResult {
  errors: RecipeFormErrors;
  resolvedImage: RecipeImageResolution | null;
}

type RecipeDatabase = Pick<typeof prisma, '$executeRaw' | '$queryRaw'> & {
  ingredient: typeof prisma.ingredient;
};

function getFormValue(formData: FormData, key: RecipeFieldName): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}

function getFileValue(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (!value || typeof value === 'string') {
    return null;
  }

  return typeof value.arrayBuffer === 'function' ? value : null;
}

function getRecipeFormValues(formData: FormData): RecipeFormFields {
  return {
    currentImageUrl: getFormValue(formData, 'currentImageUrl'),
    description: getFormValue(formData, 'description'),
    ingredientsPayload: getFormValue(formData, 'ingredientsPayload'),
    imageSource: getFormValue(formData, 'imageSource'),
    imageUrl: getFormValue(formData, 'imageUrl'),
    name: getFormValue(formData, 'name'),
  };
}

function mapRecipeIngredientRow(row: RecipeIngredientRow): SavedRecipeIngredient {
  return {
    ingredientId: row.ingredient_id,
    ingredientName: row.ingredient_name,
    quantity: row.quantity,
    unit: row.unit,
  };
}

function createRecipeIngredientMap(
  rows: RecipeIngredientRow[],
): Map<string, SavedRecipeIngredient[]> {
  const ingredientMap = new Map<string, SavedRecipeIngredient[]>();

  for (const row of rows) {
    const currentIngredients = ingredientMap.get(row.recipe_id) ?? [];

    currentIngredients.push(mapRecipeIngredientRow(row));
    ingredientMap.set(row.recipe_id, currentIngredients);
  }

  return ingredientMap;
}

function mapRecipeRow(
  row: RecipeRow,
  ingredientMap: Map<string, SavedRecipeIngredient[]> = new Map(),
): SavedRecipe {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    imageUrl: row.image_url ?? '',
    ingredients: ingredientMap.get(row.id) ?? [],
  };
}

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

function isAuthenticated(session: { user?: unknown } | null): boolean {
  return Boolean(session && 'user' in session && session.user);
}

function getImageSource(value: string): RecipeImageSource {
  return value === 'file' ? 'file' : 'url';
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

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

function parseQuantity(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

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
        item && (
          typeof item.quantity === 'number' || typeof item.quantity === 'string'
        )
          ? String(item.quantity).trim()
          : '',
    }));
  } catch {
    return null;
  }
}

async function validateRecipeIngredients(
  database: Pick<RecipeDatabase, 'ingredient'>,
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

  const existingIngredients = await database.ingredient.findMany({
    where: {
      id: {
        in: normalizedIngredients.map((ingredient) => ingredient.ingredientId),
      },
    },
    select: {
      id: true,
    },
  });

  if (existingIngredients.length !== normalizedIngredients.length) {
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

async function saveRecipeImage(file: File): Promise<string> {
  await mkdir(RECIPE_UPLOAD_DIRECTORY, { recursive: true });

  const extension = getFileExtension(file);
  const fileName = `${randomUUID()}${extension}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await writeFile(join(RECIPE_UPLOAD_DIRECTORY, fileName), fileBuffer);

  return `${RECIPE_UPLOAD_PUBLIC_PATH}/${fileName}`;
}

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
    // Файл мог быть уже удалён вручную — это не должно ломать CRUD.
  }
}

async function resolveRecipeImage(
  values: RecipeFormFields,
  imageFile: File | null,
): Promise<RecipeImageValidationResult> {
  const imageSource = getImageSource(values.imageSource);
  const currentImageUrl = values.currentImageUrl;

  if (imageSource === 'url') {
    const nextImageUrl =
      values.imageUrl
      || (!isUploadedRecipeImage(currentImageUrl) ? currentImageUrl : '');

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
    if (isUploadedRecipeImage(currentImageUrl)) {
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

async function fetchRecipeIngredientRows(
  database: Pick<RecipeDatabase, '$queryRaw'>,
  recipeIds: string[],
): Promise<RecipeIngredientRow[]> {
  if (!recipeIds.length) {
    return [];
  }

  return database.$queryRaw<RecipeIngredientRow[]>(Prisma.sql`
    select
      ri."recipeId" as recipe_id,
      ri."ingredientId" as ingredient_id,
      ri.quantity,
      i.name as ingredient_name,
      i.unit
    from recipe_ingredients ri
    inner join ingredients i on i.id = ri."ingredientId"
    where ri."recipeId" in (${Prisma.join(recipeIds)})
    order by ri."recipeId" asc, i.name asc
  `);
}

async function insertRecipeRow(
  database: Pick<RecipeDatabase, '$queryRaw'>,
  data: Omit<SavedRecipe, 'id' | 'ingredients'>,
): Promise<RecipeRow> {
  const rows = await database.$queryRaw<RecipeRow[]>`
    insert into "Recipe" (id, name, description, image_url)
    values (${randomUUID()}, ${data.name}, ${data.description}, ${data.imageUrl})
    returning id, name, description, image_url
  `;

  const row = rows[0];

  if (!row) {
    throw new Error('Failed to insert recipe');
  }

  return row;
}

async function insertRecipeIngredients(
  database: Pick<RecipeDatabase, '$executeRaw'>,
  recipeId: string,
  ingredients: RecipeIngredientInput[],
): Promise<void> {
  if (!ingredients.length) {
    return;
  }

  const values = ingredients.map((ingredient) => Prisma.sql`
    (
      ${randomUUID()},
      ${recipeId},
      ${ingredient.ingredientId},
      ${ingredient.quantity},
      now(),
      now()
    )
  `);

  await database.$executeRaw(Prisma.sql`
    insert into recipe_ingredients (
      id,
      "recipeId",
      "ingredientId",
      quantity,
      created_at,
      updated_at
    )
    values ${Prisma.join(values)}
  `);
}

async function persistRecipeUpdate(
  database: Pick<RecipeDatabase, '$queryRaw'>,
  id: string,
  data: Omit<SavedRecipe, 'id' | 'ingredients'>,
): Promise<RecipeRow | null> {
  const rows = await database.$queryRaw<RecipeRow[]>`
    update "Recipe"
    set
      name = ${data.name},
      description = ${data.description},
      image_url = ${data.imageUrl}
    where id = ${id}
    returning id, name, description, image_url
  `;

  return rows[0] ?? null;
}

async function deleteRecipeIngredients(
  database: Pick<RecipeDatabase, '$executeRaw'>,
  recipeId: string,
): Promise<void> {
  await database.$executeRaw`
    delete from recipe_ingredients
    where "recipeId" = ${recipeId}
  `;
}

async function deleteRecipeRow(
  database: Pick<RecipeDatabase, '$queryRaw'>,
  id: string,
): Promise<RecipeRow | null> {
  const rows = await database.$queryRaw<RecipeRow[]>`
    delete from "Recipe"
    where id = ${id}
    returning id, name, description, image_url
  `;

  return rows[0] ?? null;
}

export async function createRecipe(
  prevState: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const session = await auth();

  if (!isAuthenticated(session)) {
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
    prisma,
    parsedValues.data.ingredientsPayload,
  );

  if (!validatedIngredients.ingredients) {
    return createValidationErrorState(
      validatedIngredients.errors,
      prevState.recipe,
    );
  }
  const recipeIngredients = validatedIngredients.ingredients;

  const imageResult = await resolveRecipeImage(
    parsedValues.data,
    getFileValue(formData, 'imageFile'),
  );

  if (!imageResult.resolvedImage) {
    return createValidationErrorState(imageResult.errors, prevState.recipe);
  }
  const resolvedImage = imageResult.resolvedImage;

  try {
    const recipe = await prisma.$transaction(async (transaction) => {
      const recipeRow = await insertRecipeRow(transaction, {
        name: parsedValues.data.name,
        description: parsedValues.data.description,
        imageUrl: resolvedImage.imageUrl,
      });

      await insertRecipeIngredients(transaction, recipeRow.id, recipeIngredients);

      const ingredientMap = createRecipeIngredientMap(
        await fetchRecipeIngredientRows(transaction, [recipeRow.id]),
      );

      return mapRecipeRow(recipeRow, ingredientMap);
    });

    await deleteUploadedRecipeImage(
      resolvedImage.oldUploadedImageToDelete,
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

    await deleteUploadedRecipeImage(resolvedImage.imageUrl);

    return createErrorState(RECIPE_SAVE_ERROR_MESSAGE, {}, prevState.recipe);
  }
}

export async function updateRecipe(
  id: string,
  formData: FormData,
): Promise<RecipeFormState> {
  const session = await auth();

  if (!isAuthenticated(session)) {
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
    prisma,
    parsedValues.data.ingredientsPayload,
  );

  if (!validatedIngredients.ingredients) {
    return createValidationErrorState(validatedIngredients.errors, null);
  }
  const recipeIngredients = validatedIngredients.ingredients;

  const imageResult = await resolveRecipeImage(
    parsedValues.data,
    getFileValue(formData, 'imageFile'),
  );

  if (!imageResult.resolvedImage) {
    return createValidationErrorState(imageResult.errors, null);
  }
  const resolvedImage = imageResult.resolvedImage;

  try {
    const recipe = await prisma.$transaction(async (transaction) => {
      const updatedRecipeRow = await persistRecipeUpdate(transaction, id, {
        name: parsedValues.data.name,
        description: parsedValues.data.description,
        imageUrl: resolvedImage.imageUrl,
      });

      if (!updatedRecipeRow) {
        return null;
      }

      await deleteRecipeIngredients(transaction, id);
      await insertRecipeIngredients(transaction, id, recipeIngredients);

      const ingredientMap = createRecipeIngredientMap(
        await fetchRecipeIngredientRows(transaction, [id]),
      );

      return mapRecipeRow(updatedRecipeRow, ingredientMap);
    });

    if (!recipe) {
      if (
        resolvedImage.imageUrl !== parsedValues.data.currentImageUrl
      ) {
        await deleteUploadedRecipeImage(resolvedImage.imageUrl);
      }

      return createErrorState(RECIPE_UPDATE_ERROR_MESSAGE);
    }

    await deleteUploadedRecipeImage(
      resolvedImage.oldUploadedImageToDelete,
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

    if (resolvedImage.imageUrl !== parsedValues.data.currentImageUrl) {
      await deleteUploadedRecipeImage(resolvedImage.imageUrl);
    }

    return createErrorState(RECIPE_UPDATE_ERROR_MESSAGE);
  }
}

export async function deleteRecipe(
  id: string,
): Promise<RecipeDeleteResult> {
  const session = await auth();

  if (!isAuthenticated(session)) {
    return {
      status: 'error',
      message: RECIPE_UNAUTHORIZED_MESSAGE,
      deletedRecipeId: null,
    };
  }

  try {
    const deletedRecipe = await prisma.$transaction(async (transaction) => {
      await deleteRecipeIngredients(transaction, id);

      return deleteRecipeRow(transaction, id);
    });

    if (!deletedRecipe) {
      return {
        status: 'error',
        message: RECIPE_DELETE_ERROR_MESSAGE,
        deletedRecipeId: null,
      };
    }

    await deleteUploadedRecipeImage(deletedRecipe.image_url);
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
