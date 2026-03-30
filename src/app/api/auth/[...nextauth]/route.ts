import { handlers } from '@/auth/auth';

/**
 * NextAuth отдаёт готовые обработчики GET/POST, а route-файл лишь публикует их
 * в App Router по правильному пути `/api/auth/[...nextauth]`.
 */
export const { GET, POST } = handlers;
