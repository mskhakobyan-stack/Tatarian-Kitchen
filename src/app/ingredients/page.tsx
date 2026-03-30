import { IngredientFormShell } from '@/app/forms/ingredient-form-shell';
import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';

/**
 * Страница ингредиентов теперь кроме общего каркаса показывает клиентскую
 * форму ввода, чтобы сюда можно было добавлять карточки продуктов.
 */
export default function IngredientsPage() {
  const content = staticPageContent.ingredients;

  return (
    <PageShell description={content.description} title={content.title}>
      <IngredientFormShell />
    </PageShell>
  );
}
