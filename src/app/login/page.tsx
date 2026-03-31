import { LoginForm } from '@/app/forms/login.form';
import { PageShell } from '@/components/UI/page-shell';
import { formSurfaceClassName } from '@/components/UI/ui-theme';
import { staticPageContent } from '@/content/site-content';

/**
 * Пока реальный вход живёт в модальном окне хедера, эта страница служит
 * запасной точкой расширения под будущую полноценную авторизацию.
 */
interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string | string[] | undefined;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const content = staticPageContent.login;
  const { callbackUrl } = await searchParams;
  const needsAuthForIngredients = callbackUrl === '/ingredients';

  return (
    <PageShell
      description={
        needsAuthForIngredients
          ? 'Войдите в аккаунт, чтобы открыть страницу ингредиентов.'
          : content.description
      }
      title={content.title}
    >
      <section
        className={`mt-4 max-w-md ${formSurfaceClassName} p-6`}
      >
        <LoginForm />
      </section>
    </PageShell>
  );
}
