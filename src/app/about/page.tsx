import { PageShell } from '@/components/UI/page-shell';
import { aboutPageContent } from '@/content/site-content';
import GlobalContentBanner from '@/components/UI/global-content-banner';

/**
 * Страница "О нас" собирается из двух отдельных частей:
 * вводного баннера и текстовой статьи с абзацами из контентного слоя.
 */
export default function AboutPage() {
  return (
    <>
      <GlobalContentBanner />
      <PageShell title={aboutPageContent.title}>
        <div className="flex max-w-2xl flex-col gap-6 text-base leading-7 text-black/70">
          {aboutPageContent.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </PageShell>
    </>
  );
}
