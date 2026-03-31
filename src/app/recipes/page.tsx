import { auth } from '@/auth/auth';
import { RecipeFormShell } from '@/app/forms/recipe-form-shell';
import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';
import type { Unit } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import type {
  RecipeIngredientOption,
  SavedRecipe,
  SavedRecipeIngredient,
} from '@/types/recipe-form';

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
  unit: Unit;
}

function createIngredientMap(
  rows: RecipeIngredientRow[],
): Map<string, SavedRecipeIngredient[]> {
  const ingredientMap = new Map<string, SavedRecipeIngredient[]>();

  for (const row of rows) {
    const recipeIngredients = ingredientMap.get(row.recipe_id) ?? [];

    recipeIngredients.push({
      ingredientId: row.ingredient_id,
      ingredientName: row.ingredient_name,
      quantity: row.quantity,
      unit: row.unit,
    });
    ingredientMap.set(row.recipe_id, recipeIngredients);
  }

  return ingredientMap;
}

/**
 * Страница рецептов использует общий шаблон, чтобы структура разделов
 * оставалась одинаковой и менялся только фактический контент.
 */
export default async function RecipesPage() {
  const session = await auth();
  const content = staticPageContent.recipes;
  const [recipeRows, recipeIngredientRows, availableIngredients] = await Promise.all([
    prisma.$queryRaw<RecipeRow[]>`
      select id, name, description, image_url
      from "Recipe"
      order by name asc
    `,
    prisma.$queryRaw<RecipeIngredientRow[]>`
      select
        ri."recipeId" as recipe_id,
        ri."ingredientId" as ingredient_id,
        ri.quantity,
        i.name as ingredient_name,
        i.unit
      from recipe_ingredients ri
      inner join ingredients i on i.id = ri."ingredientId"
      order by ri."recipeId" asc, i.name asc
    `,
    prisma.ingredient.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        unit: true,
      },
    }),
  ]);
  const ingredientMap = createIngredientMap(recipeIngredientRows);
  const recipes: SavedRecipe[] = recipeRows.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    description: recipe.description ?? '',
    imageUrl: recipe.image_url ?? '',
    ingredients: ingredientMap.get(recipe.id) ?? [],
  }));
  const canManage = Boolean(session?.user);
  const ingredientOptions: RecipeIngredientOption[] = availableIngredients.map(
    (ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      unit: ingredient.unit,
    }),
  );

  return (
    <PageShell description={content.description} title={content.title}>
      <RecipeFormShell
        availableIngredients={ingredientOptions}
        canManage={canManage}
        initialRecipes={recipes}
      />
    </PageShell>
  );
}
