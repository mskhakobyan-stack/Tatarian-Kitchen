'use client';

import dynamic from 'next/dynamic';

const HeaderBar = dynamic(() => import('@/components/UI/header'), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="border-b border-[#ead8c3] bg-[#fffbf6]/72 px-4 py-4 backdrop-blur-md"
    >
      <div className="mx-auto h-12 w-full max-w-6xl" />
    </div>
  ),
});

/**
 * Оболочка делает хедер полностью клиентским, чтобы исключить hydration-конфликты
 * при изменении клиентского auth/pathname-состояния и при dev hot reload.
 */
export function HeaderBarShell() {
  return <HeaderBar />;
}
