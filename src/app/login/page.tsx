import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';

/**
 * Пока реальный вход живёт в модальном окне хедера, эта страница служит
 * запасной точкой расширения под будущую полноценную авторизацию.
 */
export default function LoginPage() {
  const content = staticPageContent.login;

  return <PageShell description={content.description} title={content.title} />;
}
