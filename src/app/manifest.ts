import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Татарская кухня',
    short_name: 'Татарская кухня',
    description: 'Рецепты татарской кухни',
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
