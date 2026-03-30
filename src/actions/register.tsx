'use server';

import { Prisma } from '@/generated/prisma/client';
import { hashPassword } from '@/auth/password';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/schema/zod';
import { type RegisterFormState } from '@/types/form-data';

function getFormValue(
  formData: FormData,
  key: 'email' | 'password' | 'confirmPassword',
): string {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return '';
  }

  return key === 'email' ? value.trim() : value;
}

export async function registerUser(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const result = await registerSchema.safeParseAsync({
    email: getFormValue(formData, 'email'),
    password: getFormValue(formData, 'password'),
    confirmPassword: getFormValue(formData, 'confirmPassword'),
  });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return {
      status: 'error',
      message: 'Проверьте данные формы и попробуйте снова.',
      errors: {
        email: errors.email ?? [],
        password: errors.password ?? [],
        confirmPassword: errors.confirmPassword ?? [],
      },
    };
  }

  const { email, password } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        status: 'error',
        message: 'Пользователь с такой почтой уже существует.',
        errors: {
          email: ['Пользователь с такой почтой уже существует'],
        },
      };
    }

    await prisma.user.create({
      data: {
        email,
        password: await hashPassword(password),
      },
    });

    return {
      status: 'success',
      message: 'Пользователь успешно зарегистрирован.',
      errors: {},
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        status: 'error',
        message: 'Пользователь с такой почтой уже существует.',
        errors: {
          email: ['Пользователь с такой почтой уже существует'],
        },
      };
    }

    console.error('Failed to register user', error);

    return {
      status: 'error',
      message: 'Не удалось сохранить пользователя. Попробуйте ещё раз.',
      errors: {},
    };
  }
}
