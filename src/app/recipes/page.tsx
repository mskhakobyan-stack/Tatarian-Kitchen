import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';

/**
 * Страница рецептов использует общий шаблон, чтобы структура разделов
 * оставалась одинаковой и менялся только фактический контент.
 */
export default function RecipesPage() {
  const content = staticPageContent.recipes;

  return <PageShell description={content.description} title={content.title} />;
}
