import { getOptionalSession } from '@/auth/auth';
import { RecipeFormShell } from '@/app/forms/recipe-form-shell';
import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';
import {
  listRecipeIngredientOptions,
  listRecipesForDisplay,
} from '@/lib/recipe-records';

/**
 * Страница рецептов использует общий шаблон, чтобы структура разделов
 * оставалась одинаковой и менялся только фактический контент.
 */
export default async function RecipesPage() {
  const content = staticPageContent.recipes;
  const [{ session }, recipes, ingredientOptions] = await Promise.all([
    getOptionalSession(),
    listRecipesForDisplay(),
    listRecipeIngredientOptions(),
  ]);
  const currentUserId =
    typeof session?.user?.id === 'string' ? session.user.id : null;

  return (
    <PageShell description={content.description} title={content.title}>
      <RecipeFormShell
        availableIngredients={ingredientOptions}
        currentUserId={currentUserId}
        initialRecipes={recipes}
      />
    </PageShell>
  );
}
