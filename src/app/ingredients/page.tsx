import { IngredientFormShell } from '@/app/forms/ingredient-form-shell';
import { getOptionalSession } from '@/auth/auth';
import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';
import { prisma } from '@/lib/prisma';

/**
 * Страница ингредиентов читает актуальные записи из базы на сервере,
 * а интерактивную работу с формой и таблицей отдаёт клиентскому слою.
 */
export default async function IngredientsPage() {
  const content = staticPageContent.ingredients;
  const [{ session }, ingredientRows] = await Promise.all([
    getOptionalSession(),
    prisma.ingredient.findMany({
      orderBy: {
        createdAt: 'desc',
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
    }),
  ]);
  const currentUserId =
    typeof session?.user?.id === 'string' ? session.user.id : null;
  const ingredients = ingredientRows.map((ingredient) => ({
    ...ingredient,
    description: ingredient.description ?? '',
    ownerId: ingredient.ownerId ?? null,
    price: ingredient.price ?? 0,
  }));

  return (
    <PageShell description={content.description} title={content.title}>
      <IngredientFormShell
        currentUserId={currentUserId}
        initialIngredients={ingredients}
      />
    </PageShell>
  );
}
