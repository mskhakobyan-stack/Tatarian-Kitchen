'use server';

import { randomUUID } from 'node:crypto';

import { hashPassword } from '@/auth/password';
import {
  pickStringFormValues,
  type StringFormFieldConfig,
} from '@/lib/form-data';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/schema/zod';
import type {
  RegisterFieldName,
  RegisterFormErrors,
  RegisterFormFields,
  RegisterFormState,
} from '@/types/form-data';

const DUPLICATE_EMAIL_MESSAGE = 'Пользователь с такой почтой уже существует.';
const REGISTRATION_SUCCESS_MESSAGE = 'Пользователь успешно зарегистрирован.';
const UNKNOWN_REGISTRATION_ERROR_MESSAGE =
  'Не удалось сохранить пользователя. Попробуйте ещё раз.';
const REGISTER_FORM_FIELDS = [
  { key: 'email' },
  { key: 'password', trim: false },
  { key: 'confirmPassword', trim: false },
] as const satisfies readonly StringFormFieldConfig<RegisterFieldName>[];

interface CreatedUserRow {
  id: string;
}

/**
 * Собираем сырые значения формы в объект, который ожидает zod-схема.
 */
function getRegisterFormValues(formData: FormData): RegisterFormFields {
  return pickStringFormValues(formData, REGISTER_FORM_FIELDS);
}

/**
 * Формируем единый объект ошибки для `useActionState`.
 */
function createErrorState(
  message: string,
  errors: RegisterFormErrors = {},
): RegisterFormState {
  return {
    status: 'error',
    message,
    errors,
  };
}

/**
 * Ответ для кейса, когда email уже занят.
 */
function createDuplicateEmailState(): RegisterFormState {
  return createErrorState(DUPLICATE_EMAIL_MESSAGE, {
    email: [DUPLICATE_EMAIL_MESSAGE],
  });
}

/**
 * Приводим ошибки zod к форме, которую легко читать интерфейсу.
 */
function createValidationErrorState(
  errors: RegisterFormErrors,
): RegisterFormState {
  return createErrorState('Проверьте данные формы и попробуйте снова.', {
    email: errors.email ?? [],
    password: errors.password ?? [],
    confirmPassword: errors.confirmPassword ?? [],
  });
}

/**
 * Создаём пользователя через raw SQL, чтобы не зависеть от stale Prisma metadata
 * в dev-сервере. `ON CONFLICT` одновременно защищает от дублей и гонок.
 */
async function insertUser(
  email: string,
  password: string,
): Promise<CreatedUserRow | null> {
  const createdUsers = await prisma.$queryRaw<CreatedUserRow[]>`
    insert into users (id, email, password, created_at, updated_at)
    values (${randomUUID()}, ${email}, ${await hashPassword(password)}, now(), now())
    on conflict (email) do nothing
    returning id
  `;

  return createdUsers[0] ?? null;
}

/**
 * Серверный action валидирует данные, проверяет уникальность email,
 * хеширует пароль и сохраняет пользователя в базу.
 */
export async function registerUser(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const result = await registerSchema.safeParseAsync(
    getRegisterFormValues(formData),
  );

  if (!result.success) {
    return createValidationErrorState(result.error.flatten().fieldErrors);
  }

  const { email, password } = result.data;

  try {
    const createdUser = await insertUser(email, password);

    if (!createdUser) {
      return createDuplicateEmailState();
    }

    return {
      status: 'success',
      message: REGISTRATION_SUCCESS_MESSAGE,
      errors: {},
    };
  } catch (error) {
    console.error('Failed to register user', error);

    return createErrorState(UNKNOWN_REGISTRATION_ERROR_MESSAGE);
  }
}
