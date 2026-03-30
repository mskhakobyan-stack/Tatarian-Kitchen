import { aboutIntroContent } from '@/content/site-content';

/**
 * Баннер-обложка для страницы "О нас".
 *
 * Он отделён от самой страницы, чтобы крупный вводный блок можно было
 * развивать независимо: добавлять фон, CTA или медиа, не перегружая `page.tsx`.
 */
export default function GlobalContentBanner() {
  return (
    <section className="border-b border-[#ecd4aa] bg-[linear-gradient(180deg,#fff7eb_0%,#fff2da_100%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8b5b2f]">
          {aboutIntroContent.eyebrow}
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-[#5a3110]">
          {aboutIntroContent.title}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-[#7a532a] sm:text-base">
          {aboutIntroContent.description}
        </p>
      </div>
    </section>
  );
}
