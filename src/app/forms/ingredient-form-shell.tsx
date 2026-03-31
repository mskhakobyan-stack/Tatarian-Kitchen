'use client';

import dynamic from 'next/dynamic';

import type { SavedIngredient } from '@/types/ingredient-form';

const IngredientsManager = dynamic(
  () =>
    import('./ingredients-manager').then((module) => module.IngredientsManager),
  {
    /**
     * HeroUI Select внутри формы даёт разный стартовый текст на сервере
     * и в браузере, поэтому форму безопаснее рендерить только на клиенте.
     */
    ssr: false,
    loading: () => (
      <div className="mt-4 flex w-full flex-col gap-4">
        <section className="flex w-full flex-col gap-2 rounded-3xl border border-black/10 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="h-6 w-2/3 rounded-full bg-black/6" />
          <div className="h-11 w-full rounded-2xl bg-black/6" />
          <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-3">
            <div className="h-11 rounded-2xl bg-black/6" />
            <div className="h-11 rounded-2xl bg-black/6" />
            <div className="col-span-2 h-11 rounded-2xl bg-black/6 md:col-span-1" />
          </div>
          <div className="h-11 w-full rounded-2xl bg-black/6" />
        </section>
        <section className="w-full rounded-3xl border border-black/10 bg-white/70 p-6 shadow-sm">
          <div className="h-6 w-56 rounded-full bg-black/6" />
          <div className="mt-4 h-72 w-full rounded-2xl bg-black/6" />
        </section>
      </div>
    ),
  },
);

interface IngredientFormShellProps {
  initialIngredients: SavedIngredient[];
}

export function IngredientFormShell({
  initialIngredients,
}: IngredientFormShellProps) {
  return <IngredientsManager initialIngredients={initialIngredients} />;
}
