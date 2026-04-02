import 'server-only';

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  RecipeIngredientInput,
  RecipeIngredientOption,
  SavedRecipe,
} from '@/types/recipe-form';

/**
 * Select-ы держим как отдельные константы, чтобы все server-side запросы
 * к рецептам возвращали один и тот же, уже нормализованный shape данных.
 */
const recipeDetailsSelect = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  ownerId: true,
  ingredients: {
    select: {
      ingredientId: true,
      quantity: true,
      ingredient: {
        select: {
          name: true,
          unit: true,
        },
      },
    },
  },
} satisfies Prisma.RecipeSelect;

const recipeIngredientOptionSelect = {
  id: true,
  name: true,
  unit: true,
} satisfies Prisma.ingredientSelect;

type RecipeRecord = Prisma.RecipeGetPayload<{
  select: typeof recipeDetailsSelect;
}>;

type IngredientOptionRecord = Prisma.ingredientGetPayload<{
  select: typeof recipeIngredientOptionSelect;
}>;

type DeletedRecipeRecord = {
  id: string;
  imageUrl: string | null;
};

type RecipePersistenceInput = {
  description: string;
  imageUrl: string;
  ingredients: RecipeIngredientInput[];
  name: string;
  ownerId?: string | null;
};

type RecipeDatabase = Pick<
  typeof prisma,
  'ingredient' | 'recipe' | 'recipeIngredient'
>;

function mapRecipeRecord(recipe: RecipeRecord): SavedRecipe {
  const ingredients = [...recipe.ingredients]
    .sort((left, right) =>
      left.ingredient.name.localeCompare(right.ingredient.name),
    )
    .map((ingredient) => ({
      ingredientId: ingredient.ingredientId,
      ingredientName: ingredient.ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.ingredient.unit,
    }));

  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description ?? '',
    imageUrl: recipe.imageUrl ?? '',
    ownerId: recipe.ownerId ?? null,
    ingredients,
  };
}

function mapIngredientOption(
  ingredient: IngredientOptionRecord,
): RecipeIngredientOption {
  return {
    id: ingredient.id,
    name: ingredient.name,
    unit: ingredient.unit,
  };
}

function getRecipePersistenceData(input: RecipePersistenceInput) {
  return {
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl,
    ...(input.ownerId
      ? {
          owner: {
            connect: {
              id: input.ownerId,
            },
          },
        }
      : {}),
    ingredients: {
      create: input.ingredients.map((ingredient) => ({
        quantity: ingredient.quantity,
        ingredient: {
          connect: {
            id: ingredient.ingredientId,
          },
        },
      })),
    },
  };
}

function isRecordNotFoundError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError
    && error.code === 'P2025'
  );
}

/**
 * Серверная страница и actions читают рецепты через один helper, чтобы
 * карточки и пост-мутационные ответы больше не расходились по структуре.
 */
export async function listRecipesForDisplay(
  database: RecipeDatabase = prisma,
): Promise<SavedRecipe[]> {
  const recipes = await database.recipe.findMany({
    orderBy: {
      name: 'asc',
    },
    select: recipeDetailsSelect,
  }) as RecipeRecord[];

  return recipes.map(mapRecipeRecord);
}

/**
 * Отдельно готовим список ингредиентов для формы рецепта, чтобы server page
 * не занималась повторным маппингом Prisma-ответов вручную.
 */
export async function listRecipeIngredientOptions(
  database: Pick<RecipeDatabase, 'ingredient'> = prisma,
): Promise<RecipeIngredientOption[]> {
  const ingredients = await database.ingredient.findMany({
    orderBy: {
      name: 'asc',
    },
    select: recipeIngredientOptionSelect,
  });

  return ingredients.map(mapIngredientOption);
}

/**
 * Проверка существования ингредиентов остаётся на сервере, чтобы нельзя было
 * отправить рецепт со старыми или подменёнными `ingredientId`.
 */
export async function allRecipeIngredientIdsExist(
  database: Pick<RecipeDatabase, 'ingredient'>,
  ingredientIds: string[],
): Promise<boolean> {
  if (!ingredientIds.length) {
    return false;
  }

  const existingIngredients = await database.ingredient.findMany({
    where: {
      id: {
        in: ingredientIds,
      },
    },
    select: {
      id: true,
    },
  });

  return existingIngredients.length === ingredientIds.length;
}

/**
 * Создание рецепта и его состава выполняем в одном Prisma-вызове,
 * а наружу сразу отдаём shape, готовый для UI.
 */
export async function createRecipeRecord(
  database: RecipeDatabase,
  input: RecipePersistenceInput,
): Promise<SavedRecipe> {
  const recipe = await database.recipe.create({
    data: getRecipePersistenceData(input),
    select: recipeDetailsSelect,
  });

  return mapRecipeRecord(recipe);
}

/**
 * Обновление полностью пересобирает состав рецепта, потому что UI отправляет
 * весь текущий список ингредиентов целиком, а не patch по отдельным строкам.
 */
export async function updateRecipeRecord(
  database: RecipeDatabase,
  id: string,
  input: RecipePersistenceInput,
): Promise<SavedRecipe | null> {
  try {
    const recipe = await database.recipe.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        imageUrl: input.imageUrl,
        ingredients: {
          deleteMany: {},
          create: getRecipePersistenceData(input).ingredients.create,
        },
      },
      select: recipeDetailsSelect,
    });

    return mapRecipeRecord(recipe);
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}

/**
 * Удаление держим отдельным helper-ом, чтобы и action, и будущие фоновые задачи
 * использовали одинаковую последовательность очистки связей и самой записи.
 */
export async function deleteRecipeRecord(
  database: RecipeDatabase,
  id: string,
): Promise<DeletedRecipeRecord | null> {
  await database.recipeIngredient.deleteMany({
    where: {
      recipeId: id,
    },
  });

  try {
    return await database.recipe.delete({
      where: { id },
      select: {
        id: true,
        imageUrl: true,
      },
    });
  } catch (error) {
    if (isRecordNotFoundError(error)) {
      return null;
    }

    throw error;
  }
}
