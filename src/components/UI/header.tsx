'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button, Header, Toolbar } from '@heroui/react';

import { LoginForm } from '@/app/forms/login.form';
import { RegistrationForm } from '@/app/forms/registration.form';
import { useAuthStore } from '@/auth/auth-store';
import { AuthDialog } from '@/components/UI/auth-dialog';
import { navigationItems, siteMetadata } from '@/content/site-content';

const navLinkBaseClassName =
  'rounded-full border px-4 py-2 text-sm font-semibold tracking-[0.02em] transition-all duration-200';

const filledButtonClassName =
  'border border-[#8b4418] bg-[#8b4418] px-4 text-sm font-semibold tracking-[0.02em] text-[#fff7eb] shadow-sm transition-colors hover:bg-[#743714]';

const softButtonClassName =
  'border border-[#d6b47f] bg-[#fff3dd] px-4 text-sm font-semibold tracking-[0.02em] text-[#6a3b14] transition-colors hover:bg-[#f8e6bf]';

/**
 * Небольшой helper держит логику активной/неактивной ссылки отдельно от JSX.
 */
function getNavLinkClassName(isActive: boolean): string {
  return `${navLinkBaseClassName} ${
    isActive
      ? 'border-[#6d3a14] bg-[#6d3a14] text-[#fff8ed] shadow-sm'
      : 'border-transparent text-[#7a532a] hover:border-[#e1c694] hover:bg-[#fff0cf] hover:text-[#5a3110]'
  }`;
}

/**
 * Логотип вынесен в отдельный компонент, чтобы его было проще переиспользовать
 * в будущем, например, в footer или мобильном меню.
 */
export const SiteLogo = () => {
  return (
    <Image
      alt="Логотип сайта"
      className="h-12 w-12 rounded-full border border-[#d7bb8b] bg-[#fff6e7] object-cover shadow-[0_10px_24px_-18px_rgba(96,53,11,0.85)]"
      height={44}
      priority
      src="/site-logo.svg"
      width={44}
    />
  );
};

/**
 * Хедер показывает навигацию и текущий auth-state пользователя.
 *
 * Серверную сессию он напрямую не читает: вместо этого работает через Zustand-store,
 * который уже синхронизирован с next-auth в других слоях приложения.
 */
export default function HeaderBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signOutError, setSignOutError] = useState('');
  const [isSigningOut, startTransition] = useTransition();
  const authStatus = useAuthStore((store) => store.status);
  const userEmail = useAuthStore((store) => store.user?.email ?? null);
  const clearAuth = useAuthStore((store) => store.clearAuth);
  const isAuthenticated =
    authStatus === 'authenticated' && Boolean(userEmail);

  const handleSignOut = () => {
    startTransition(async () => {
      setSignOutError('');

      try {
        await signOut({ redirect: false });
        clearAuth();
        router.refresh();
      } catch (error) {
        console.error('Failed to sign out', error);
        setSignOutError('Не удалось выйти. Попробуйте ещё раз.');
      }
    });
  };

  return (
    <Header className="border-b border-[#d9bd90] bg-[#fff8ec]/95 px-4 py-4 font-sans text-[#5a3110] shadow-[0_12px_34px_-28px_rgba(96,53,11,0.65)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          className="flex items-center gap-3 text-inherit no-underline"
          href="/"
        >
          <SiteLogo />
          <span className="text-base font-semibold tracking-[0.04em] text-[#5a3110] sm:text-lg">
            {siteMetadata.name}
          </span>
        </Link>

        <Toolbar
          className="hidden items-center gap-3 sm:flex"
          orientation="horizontal"
        >
          {navigationItems.map(({ href, label }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                aria-current={isActive ? 'page' : undefined}
                className={getNavLinkClassName(isActive)}
                href={href}
              >
                {label}
              </Link>
            );
          })}
        </Toolbar>

        {isAuthenticated ? (
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 rounded-full border border-[#e1c795] bg-[#fff2da] px-4 py-2 shadow-[0_10px_24px_-20px_rgba(96,53,11,0.55)]">
              <p className="text-sm font-medium tracking-[0.01em] text-[#6a3b14]">
                Здравствуйте, {userEmail}!
              </p>
              <Button
                className={softButtonClassName}
                isDisabled={isSigningOut}
                onPress={handleSignOut}
                variant="secondary"
              >
                {isSigningOut ? 'Выход...' : 'Выход'}
              </Button>
            </div>
            {signOutError ? (
              <p className="text-sm text-danger">{signOutError}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <AuthDialog
              buttonClassName={softButtonClassName}
              buttonLabel="Вход"
              buttonVariant="secondary"
              heading="Вход"
            >
              <LoginForm />
            </AuthDialog>
            <AuthDialog
              buttonClassName={filledButtonClassName}
              buttonLabel="Регистрация"
              buttonVariant="primary"
              heading="Регистрация"
            >
              <RegistrationForm />
            </AuthDialog>
          </div>
        )}
      </div>
    </Header>
  );
}
