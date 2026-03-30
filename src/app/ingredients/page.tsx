import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';

/**
 * Страница ингредиентов пока статическая, поэтому ей достаточно общего
 * `PageShell` и текста из контентного словаря.
 */
export default function IngredientsPage() {
  const content = staticPageContent.ingredients;

  return <PageShell description={content.description} title={content.title} />;
}
