import type { ReactNode } from 'react';

interface PageShellProps {
  children?: ReactNode;
  description?: string;
  title: string;
}

/**
 * Единый каркас для простых контентных страниц.
 *
 * Он держит одинаковую ширину контейнера, отступы и типографику,
 * чтобы страницы сайта выглядели последовательно и меняли только контент.
 */
export function PageShell({
  children,
  description,
  title,
}: PageShellProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>

      {description ? (
        <p className="max-w-2xl text-base leading-7 text-black/70">
          {description}
        </p>
      ) : null}

      {children}
    </section>
  );
}
