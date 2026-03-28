import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { scryptSync, timingSafeEqual } from 'node:crypto';
import { ZodError } from 'zod';

import { prisma } from '@/lib/prisma';
import { signInSchema } from '@/schema/zod';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function verifyPassword(password: string, storedPassword: string): boolean {
  const [salt, storedHash] = storedPassword.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(storedHash, 'hex');

  if (storedHashBuffer.length !== derivedHash.length) {
    return false;
  }

  return timingSafeEqual(storedHashBuffer, derivedHash);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const tokenId =
          typeof token.id === 'string' ? token.id : token.sub;

        if (tokenId) {
          session.user.id = tokenId;
        }

        session.user.email =
          typeof token.email === 'string' ? token.email : session.user.email;
        session.user.name =
          typeof token.name === 'string' ? token.name : session.user.name;
      }

      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } =
            await signInSchema.parseAsync(credentials);

          const user = await prisma.user.findUnique({
            where: {
              email: email.toLowerCase(),
            },
          });

          if (!user || !verifyPassword(password, user.password)) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.email.split('@')[0],
          };
        } catch (error) {
          if (error instanceof ZodError) {
            return null;
          }

          throw error;
        }
      },
    }),
  ],
});
