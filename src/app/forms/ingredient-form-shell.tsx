'use client';

import dynamic from 'next/dynamic';

const IngredientForm = dynamic(
  () => import('./ingredient.form').then((module) => module.IngredientForm),
  {
    /**
     * HeroUI Select внутри формы даёт разный стартовый текст на сервере
     * и в браузере, поэтому форму безопаснее рендерить только на клиенте.
     */
    ssr: false,
    loading: () => (
      <div className="mt-6 flex w-full flex-col items-center gap-6">
        <section className="flex w-full max-w-2xl flex-col gap-4 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm lg:w-1/3">
          <div className="h-6 w-2/3 rounded-full bg-black/6" />
          <div className="h-11 w-full rounded-2xl bg-black/6" />
          <div className="grid w-full grid-cols-2 gap-4 md:grid-cols-3">
            <div className="h-11 rounded-2xl bg-black/6" />
            <div className="h-11 rounded-2xl bg-black/6" />
            <div className="col-span-2 h-11 rounded-2xl bg-black/6 md:col-span-1" />
          </div>
          <div className="h-32 w-full rounded-2xl bg-black/6" />
        </section>
      </div>
    ),
  },
);

export function IngredientFormShell() {
  return <IngredientForm />;
}
