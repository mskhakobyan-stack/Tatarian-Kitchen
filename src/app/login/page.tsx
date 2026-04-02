import { redirect } from 'next/navigation';

import { LoginForm } from '@/app/forms/login.form';
import { getOptionalSession } from '@/auth/auth';
import { PageShell } from '@/components/UI/page-shell';
import { formSurfaceClassName } from '@/components/UI/ui-theme';
import { staticPageContent } from '@/content/site-content';
import { getSafeCallbackUrl } from '@/lib/auth-redirect';

/**
 * Отдельная страница входа полезна как fallback-маршрут и точка входа
 * для redirect-потоков, когда пользователя нужно вернуть на конкретную страницу.
 */
interface LoginPageProps {
  searchParams: Promise<{
    callbackUrl?: string | string[] | undefined;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const content = staticPageContent.login;
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = getSafeCallbackUrl(callbackUrl);
  const { session } = await getOptionalSession();
  const needsAuthForIngredients = safeCallbackUrl === '/ingredients';

  if (session?.user) {
    redirect(safeCallbackUrl ?? '/');
  }

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
