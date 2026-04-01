import Image from 'next/image';
import { PageShell } from '@/components/UI/page-shell';
import { staticPageContent } from '@/content/site-content';

/**
 * Главная страница больше не держит временный placeholder.
 * Она использует тот же каркас, что и остальные простые разделы сайта.
 */
export default function Home() {
  const content = staticPageContent.home;

  return (
    <PageShell description={content.description} title={content.title}>
      <div className="mt-4 mr-auto w-full max-w-[560px] overflow-hidden rounded-[32px] border border-[#e3c89d] bg-[#fff7ea] shadow-[0_24px_48px_-34px_rgba(96,53,11,0.48)]">
        <Image
          alt="Баннер с блюдами татарской кухни"
          className="block h-auto w-full object-contain"
          height={745}
          preload
          sizes="(max-width: 560px) 100vw, 560px"
          src="/home-banner.jpg"
          width={1119}
        />
      </div>
    </PageShell>
  );
}
