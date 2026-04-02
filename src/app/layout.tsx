import type { Metadata } from 'next';

import { getOptionalSession } from '@/auth/auth';
import { HeaderBarShell } from '@/components/UI/header-shell';
import { siteMetadata } from '@/content/site-content';

import './globals.css';
import { AuthSessionProvider } from './session-provider';

/**
 * Метаданные читаем из общего контентного модуля, чтобы название и описание
 * сайта не дублировались между layout, manifest и интерфейсом.
 */
export const metadata: Metadata = {
  title: siteMetadata.name,
  description: siteMetadata.description,
  icons: {
    icon: '/site-logo.svg',
  },
};

/**
 * Корневой layout отвечает только за глобальный каркас приложения:
 * HTML-оболочку, серверную сессию, провайдеры и хедер.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Сессию получаем на сервере один раз и передаём дальше в клиентские провайдеры.
  const { authAvailable, session } = await getOptionalSession();

  return (
    <html lang={siteMetadata.language} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider authAvailable={authAvailable} session={session}>
          <HeaderBarShell />
          <main className="flex-1">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
