'use client';

import { useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button, Header, Modal, Toolbar } from '@heroui/react';

import { useAuthStore } from '@/auth/auth-store';

import { LoginForm } from '../../app/forms/login.form';
import { RegistartionForm } from '../../app/forms/registration.form';

const navItems = [
  { href: '/recipes', label: 'Рецепты' },
  { href: '/ingredients', label: 'Ингредиенты' },
  { href: '/about', label: 'О нас' },
];

const navLinkBaseClassName =
  'rounded-full border px-4 py-2 text-sm font-semibold tracking-[0.02em] transition-all duration-200';

const filledButtonClassName =
  'border border-[#8b4418] bg-[#8b4418] px-4 text-sm font-semibold tracking-[0.02em] text-[#fff7eb] shadow-sm transition-colors hover:bg-[#743714]';

const softButtonClassName =
  'border border-[#d6b47f] bg-[#fff3dd] px-4 text-sm font-semibold tracking-[0.02em] text-[#6a3b14] transition-colors hover:bg-[#f8e6bf]';

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

export default function HeaderBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, startTransition] = useTransition();
  const authStatus = useAuthStore((store) => store.status);
  const userEmail = useAuthStore((store) => store.user?.email ?? null);
  const clearAuth = useAuthStore((store) => store.clearAuth);
  const setStatus = useAuthStore((store) => store.setStatus);
  const isAuthenticated =
    authStatus === 'authenticated' && Boolean(userEmail);

  const handleSignOut = () => {
    startTransition(async () => {
      setStatus('loading');
      await signOut({ redirect: false });
      clearAuth();
      router.refresh();
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
            Татарская кухня
          </span>
        </Link>

        <Toolbar
          className="hidden items-center gap-3 sm:flex"
          orientation="horizontal"
        >
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                aria-current={isActive ? 'page' : undefined}
                className={`${navLinkBaseClassName} ${
                  isActive
                    ? 'border-[#6d3a14] bg-[#6d3a14] text-[#fff8ed] shadow-sm'
                    : 'border-transparent text-[#7a532a] hover:border-[#e1c694] hover:bg-[#fff0cf] hover:text-[#5a3110]'
                }`}
                href={href}
              >
                {label}
              </Link>
            );
          })}
        </Toolbar>

        {isAuthenticated ? (
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
        ) : (
          <div className="flex items-center gap-3">
            <Modal>
              <Modal.Trigger>
                <Button className={softButtonClassName} variant="secondary">
                  Вход
                </Button>
              </Modal.Trigger>
              <Modal.Backdrop>
                <Modal.Container placement="center" size="md">
                  <Modal.Dialog>
                    <Modal.Header className="items-center justify-between">
                      <Modal.Heading>Вход</Modal.Heading>
                      <Modal.CloseTrigger />
                    </Modal.Header>
                    <Modal.Body>
                      <LoginForm />
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
            <Modal>
              <Modal.Trigger>
                <Button className={filledButtonClassName} variant="primary">
                  Регистрация
                </Button>
              </Modal.Trigger>
              <Modal.Backdrop>
                <Modal.Container placement="center" size="md">
                  <Modal.Dialog>
                    <Modal.Header className="items-center justify-between">
                      <Modal.Heading>Регистрация</Modal.Heading>
                      <Modal.CloseTrigger />
                    </Modal.Header>
                    <Modal.Body>
                      <RegistartionForm />
                    </Modal.Body>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </div>
        )}
      </div>
    </Header>
  );
}
