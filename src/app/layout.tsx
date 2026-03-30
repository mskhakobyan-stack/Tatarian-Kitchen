import type { Metadata } from 'next';

import { auth } from '@/auth/auth';

import './globals.css';
import HeaderBar from '../components/UI/header';
import { AuthSessionProvider } from './session-provider';

export const metadata: Metadata = {
  title: 'Татарская кухня',
  description: 'Рецепты татарской кухни',
  icons: {
    icon: '/site-logo.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthSessionProvider session={session}>
          <HeaderBar />
          <main className="flex-1">{children}</main>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
