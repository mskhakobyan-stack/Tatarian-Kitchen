'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, Header, Modal, Toolbar } from '@heroui/react';
import { LoginForm } from '../../app/forms/login.form';
import { RegistartionForm } from '../../app/forms/registration.form';

const navItems = [
  { href: '/recipes', label: 'Рецепты' },
  { href: '/ingredients', label: 'Ингредиенты' },
  { href: '/about', label: 'О нас' },
];

export const AcmeLogo = () => {
  return (
    <svg fill="none" height="36" viewBox="0 0 32 32" width="36">
      <path
        clipRule="evenodd"
        d="M17.6482 10.1305L15.8785 7.02583L7.02979 22.5499H10.5278L17.6482 10.1305ZM19.8798 14.0457L18.11 17.1983L19.394 19.4511H16.8453L15.1056 22.5499H24.7272L19.8798 14.0457Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default function HeaderBar() {
  const pathname = usePathname();

  return (
    <Header className="border-b border-black/10 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <Link
          className="flex items-center gap-3 text-inherit no-underline"
          href="/"
        >
          <AcmeLogo />
          <span className="font-bold tracking-wide">ACME</span>
        </Link>

        <Toolbar
          className="hidden items-center gap-4 sm:flex"
          orientation="horizontal"
        >
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href;

            return (
              <Link
                key={href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-black/70 hover:bg-black/5 hover:text-black'
                }`}
                href={href}
              >
                {label}
              </Link>
            );
          })}
        </Toolbar>

        <div className="flex items-center gap-3">
          <Modal>
            <Modal.Trigger className="hidden lg:inline-flex">
              <span className="text-sm font-medium text-black/70 transition-colors hover:text-black">
                Вход
              </span>
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
              <Button variant="solid">Регистрация</Button>
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
      </div>
    </Header>
  );
}
