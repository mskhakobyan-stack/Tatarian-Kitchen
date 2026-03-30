import { object, string } from 'zod';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_UPPERCASE_REGEX,
  normalizeEmail,
} from '@/auth/auth-validation';

/**
 * Базовая схема email одновременно проверяет формат и нормализует значение,
 * чтобы дальше в auth-логике всегда использовать единый вид адреса.
 */
const emailSchema = string()
  .trim()
  .min(1, 'Email обязателен')
  .email('Введите корректный email')
  .transform(normalizeEmail);

/**
 * Общую схему пароля переиспользуем и для входа, и для регистрации.
 */
const passwordSchema = string()
  .min(1, 'Пароль обязателен')
  .min(
    PASSWORD_MIN_LENGTH,
    `Пароль должен содержать не менее ${PASSWORD_MIN_LENGTH} символов`,
  )
  .max(
    PASSWORD_MAX_LENGTH,
    `Пароль должен содержать не более ${PASSWORD_MAX_LENGTH} символов`,
  );

/**
 * При входе достаточно email и пароля.
 */
export const signInSchema = object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * При регистрации дополняем правила требованием к заглавной букве и
 * отдельной проверкой совпадения двух введённых паролей.
 */
export const registerSchema = object({
  email: emailSchema,
  password: passwordSchema.regex(
    PASSWORD_UPPERCASE_REGEX,
    'Пароль должен содержать хотя бы одну заглавную букву',
  ),
  confirmPassword: string().min(1, 'Подтвердите пароль'),
}).superRefine(({ password, confirmPassword }, context) => {
  if (confirmPassword !== password) {
    context.addIssue({
      code: 'custom',
      message: 'Пароли должны совпадать',
      path: ['confirmPassword'],
    });
  }
});
