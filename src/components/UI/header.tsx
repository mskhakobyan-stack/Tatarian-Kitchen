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
import {
  filledButtonClassName,
  softButtonClassName,
} from '@/components/UI/ui-theme';
import { navigationItems, siteMetadata } from '@/content/site-content';
import type { NavigationItem } from '@/content/site-content';

const navLinkBaseClassName =
  'rounded-full border px-4 py-2 text-sm font-semibold tracking-[0.02em] transition-all duration-200';
const authDialogItems = [
  {
    buttonLabel: 'Вход',
    buttonVariant: 'secondary' as const,
    heading: 'Вход',
    renderContent: () => <LoginForm />,
  },
  {
    buttonLabel: 'Регистрация',
    buttonVariant: 'primary' as const,
    heading: 'Регистрация',
    renderContent: () => <RegistrationForm />,
  },
] as const;

/**
 * Небольшой helper держит логику активной/неактивной ссылки отдельно от JSX.
 */
function getNavLinkClassName(isActive: boolean): string {
  return `${navLinkBaseClassName} ${
    isActive
      ? 'border-[#dec4a7] bg-[#fff5ea]/76 text-[#6c4524] shadow-[0_10px_22px_-20px_rgba(96,53,11,0.3)] backdrop-blur-sm'
      : 'border-transparent text-[#8b6742] hover:border-[#ead5bf] hover:bg-[#fff8ef]/76 hover:text-[#6a4524]'
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
      className="h-12 w-12 rounded-full border border-[#e6d2b9] bg-[#fffaf3]/76 object-cover shadow-[0_10px_24px_-18px_rgba(96,53,11,0.35)]"
      height={44}
      priority
      src="/site-logo.svg"
      width={44}
    />
  );
};

interface HeaderNavigationLinksProps {
  items: readonly NavigationItem[];
  mobile?: boolean;
  pathname: string;
  onNavigate?: () => void;
}

function HeaderNavigationLinks({
  items,
  mobile = false,
  onNavigate,
  pathname,
}: HeaderNavigationLinksProps) {
  return items.map(({ href, label }) => {
    const isActive = pathname === href;

    return (
      <Link
        key={href}
        aria-current={isActive ? 'page' : undefined}
        className={
          mobile
            ? `${getNavLinkClassName(isActive)} block text-center`
            : getNavLinkClassName(isActive)
        }
        href={href}
        onClick={onNavigate}
      >
        {label}
      </Link>
    );
  });
}

function SignOutButton({
  fullWidth = false,
  isSigningOut,
  onSignOut,
}: {
  fullWidth?: boolean;
  isSigningOut: boolean;
  onSignOut: () => void;
}) {
  return (
    <Button
      className={fullWidth ? `${softButtonClassName} w-full justify-center` : softButtonClassName}
      isDisabled={isSigningOut}
      onPress={onSignOut}
      variant="secondary"
    >
      {isSigningOut ? 'Выход...' : 'Выход'}
    </Button>
  );
}

function HeaderAuthDialogs({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? 'grid gap-2' : 'hidden items-center gap-3 sm:flex'}>
      {authDialogItems.map((dialogItem) => (
        <AuthDialog
          key={dialogItem.heading}
          buttonClassName={
            dialogItem.buttonVariant === 'primary'
              ? mobile
                ? `${filledButtonClassName} w-full justify-center`
                : filledButtonClassName
              : mobile
                ? `${softButtonClassName} w-full justify-center`
                : softButtonClassName
          }
          buttonLabel={dialogItem.buttonLabel}
          buttonVariant={dialogItem.buttonVariant}
          heading={dialogItem.heading}
        >
          {dialogItem.renderContent()}
        </AuthDialog>
      ))}
    </div>
  );
}

/**
 * Хедер показывает навигацию и текущий auth-state пользователя.
 *
 * Серверную сессию он напрямую не читает: вместо этого работает через Zustand-store,
 * который уже синхронизирован с next-auth в других слоях приложения.
 */
export default function HeaderBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [isSigningOut, startTransition] = useTransition();
  const authStatus = useAuthStore((store) => store.status);
  const userEmail = useAuthStore((store) => store.user?.email ?? null);
  const clearAuth = useAuthStore((store) => store.clearAuth);
  const isAuthenticated =
    authStatus === 'authenticated' && Boolean(userEmail);
  const visibleNavigationItems = navigationItems;

  const handleSignOut = () => {
    startTransition(async () => {
      setSignOutError('');

      try {
        await signOut({ redirect: false });
        clearAuth();
        setIsMobileMenuOpen(false);
        router.refresh();
      } catch (error) {
        console.error('Failed to sign out', error);
        setSignOutError('Не удалось выйти. Попробуйте ещё раз.');
      }
    });
  };

  return (
    <Header className="border-b border-[#ead8c3] bg-[#fffbf6]/72 px-4 py-4 font-sans text-[#6a4524] shadow-[0_12px_32px_-28px_rgba(96,53,11,0.28)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            className="flex min-w-0 items-center gap-3 text-inherit no-underline"
            href="/"
          >
            <SiteLogo />
            <span className="truncate text-base font-semibold tracking-[0.04em] text-[#6a4524] sm:text-lg">
              {siteMetadata.name}
            </span>
          </Link>

          <Button
            aria-controls="mobile-header-menu"
            aria-expanded={isMobileMenuOpen}
            className={`sm:hidden ${softButtonClassName}`}
            onPress={() => setIsMobileMenuOpen((currentOpen) => !currentOpen)}
            type="button"
            variant="secondary"
          >
            {isMobileMenuOpen ? 'Закрыть' : 'Меню'}
          </Button>

          <Toolbar
            className="hidden min-w-0 flex-1 items-center justify-center gap-3 sm:flex"
            orientation="horizontal"
          >
            <HeaderNavigationLinks
              items={visibleNavigationItems}
              pathname={pathname}
            />
          </Toolbar>

          {isAuthenticated ? (
            <div className="hidden max-w-[28rem] flex-col items-end gap-2 sm:flex">
              <div className="flex min-w-0 items-center gap-3 rounded-full border border-[#ead8c3] bg-[#fffaf3]/70 px-4 py-2 shadow-[0_10px_24px_-20px_rgba(96,53,11,0.2)] backdrop-blur-sm">
                <p className="min-w-0 truncate text-sm font-medium tracking-[0.01em] text-[#7a5634]">
                  Здравствуйте, {userEmail}!
                </p>
                <SignOutButton
                  isSigningOut={isSigningOut}
                  onSignOut={handleSignOut}
                />
              </div>
              {signOutError ? (
                <p className="text-right text-sm text-danger">{signOutError}</p>
              ) : null}
            </div>
          ) : (
            <HeaderAuthDialogs />
          )}
        </div>

        {isMobileMenuOpen ? (
          <div
            className="flex flex-col gap-4 rounded-[28px] border border-[#ead8c3] bg-[#fff9f2]/88 p-4 shadow-[0_16px_30px_-28px_rgba(96,53,11,0.35)] backdrop-blur-sm sm:hidden"
            id="mobile-header-menu"
          >
            <nav className="flex flex-col gap-2">
              <HeaderNavigationLinks
                items={visibleNavigationItems}
                mobile
                onNavigate={() => setIsMobileMenuOpen(false)}
                pathname={pathname}
              />
            </nav>

            {isAuthenticated ? (
              <div className="flex flex-col gap-3 rounded-[24px] border border-[#ead8c3] bg-[#fffdf8]/80 p-4">
                <p className="text-sm leading-6 text-[#7a5634]">
                  Здравствуйте,
                  {' '}
                  <span className="break-all font-semibold">{userEmail}</span>
                  !
                </p>
                <SignOutButton
                  fullWidth
                  isSigningOut={isSigningOut}
                  onSignOut={handleSignOut}
                />
                {signOutError ? (
                  <p className="text-sm text-danger">{signOutError}</p>
                ) : null}
              </div>
            ) : (
              <HeaderAuthDialogs mobile />
            )}
          </div>
        ) : null}
      </div>
    </Header>
  );
}
