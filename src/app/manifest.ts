import type { MetadataRoute } from 'next';

import { siteMetadata } from '@/content/site-content';

/**
 * Web App Manifest описывает, как сайт выглядит при установке как PWA.
 * Берём базовое название и описание из общего контентного слоя.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteMetadata.name,
    short_name: siteMetadata.name,
    description: siteMetadata.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fff8ec',
    theme_color: '#8b4418',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/site-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
