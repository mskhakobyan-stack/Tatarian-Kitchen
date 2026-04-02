'use client';

import dynamic from 'next/dynamic';

import {
  formSurfaceClassName,
  tableShellClassName,
} from '@/components/UI/ui-theme';
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
        <section
          className={`flex w-full flex-col gap-2 ${formSurfaceClassName} p-6`}
        >
          <div className="h-6 w-2/3 rounded-full bg-black/6" />
          <div className="h-11 w-full rounded-2xl bg-black/6" />
          <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-3">
            <div className="h-11 rounded-2xl bg-black/6" />
            <div className="h-11 rounded-2xl bg-black/6" />
            <div className="col-span-2 h-11 rounded-2xl bg-black/6 md:col-span-1" />
          </div>
          <div className="h-11 w-full rounded-2xl bg-black/6" />
        </section>
        <section className={`w-full ${tableShellClassName} p-6`}>
          <div className="h-6 w-56 rounded-full bg-black/6" />
          <div className="mt-4 h-72 w-full rounded-2xl bg-black/6" />
        </section>
      </div>
    ),
  },
);

interface IngredientFormShellProps {
  currentUserId: string | null;
  initialIngredients: SavedIngredient[];
}

export function IngredientFormShell({
  currentUserId,
  initialIngredients,
}: IngredientFormShellProps) {
  return (
    <IngredientsManager
      currentUserId={currentUserId}
      initialIngredients={initialIngredients}
    />
  );
}
