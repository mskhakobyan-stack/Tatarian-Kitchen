import { IngredientFormShell } from '@/app/forms/ingredient-form-shell';
import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';
import { prisma } from '@/lib/prisma';

/**
 * Страница ингредиентов читает актуальные записи из базы на сервере,
 * а интерактивную работу с формой и таблицей отдаёт клиентскому слою.
 */
export default async function IngredientsPage() {
  const content = staticPageContent.ingredients;
  const ingredientRows = await prisma.ingredient.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      category: true,
      description: true,
      name: true,
      price: true,
      unit: true,
    },
  });
  const ingredients = ingredientRows.map((ingredient) => ({
    ...ingredient,
    description: ingredient.description ?? '',
    price: ingredient.price ?? 0,
  }));

  return (
    <PageShell description={content.description} title={content.title}>
      <IngredientFormShell initialIngredients={ingredients} />
    </PageShell>
  );
}
