'use server';

import { randomBytes, scryptSync } from 'node:crypto';

import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import {
  type RegisterFormErrors,
  type RegisterFormFields,
  type RegisterFormState,
} from '@/types/form-data';

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function getFormValue(
  formData: FormData,
  key: keyof RegisterFormFields,
): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}

function validateRegisterForm(
  data: RegisterFormFields,
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!EMAIL_REGEX.test(data.email)) {
    errors.email = ['Введите корректный адрес электронной почты'];
  }

  if (data.password.length < 6) {
    errors.password = ['Пароль должен содержать не менее 6 символов'];
  } else if (!/[A-Z]/.test(data.password)) {
    errors.password = ['Пароль должен содержать хотя бы одну заглавную букву'];
  }

  if (data.confirmPassword !== data.password) {
    errors.confirmPassword = ['Пароли должны совпадать'];
  }

  return errors;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `${salt}:${hash}`;
}

export async function registerUser(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const data: RegisterFormFields = {
    email: getFormValue(formData, 'email').toLowerCase(),
    password: getFormValue(formData, 'password'),
    confirmPassword: getFormValue(formData, 'confirmPassword'),
  };

  const errors = validateRegisterForm(data);

  if (Object.keys(errors).length > 0) {
    return {
      status: 'error',
      message: 'Проверьте данные формы и попробуйте снова.',
      errors,
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
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
        email: data.email,
        password: hashPassword(data.password),
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
