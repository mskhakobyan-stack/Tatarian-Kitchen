import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';

/**
 * Главная страница больше не держит временный placeholder.
 * Она использует тот же каркас, что и остальные простые разделы сайта.
 */
export default function Home() {
  const content = staticPageContent.home;

  return <PageShell description={content.description} title={content.title} />;
}
