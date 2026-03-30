import { object, string } from 'zod';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_UPPERCASE_REGEX,
  normalizeEmail,
} from '@/auth/auth-validation';

const emailSchema = string()
  .trim()
  .min(1, 'Email обязателен')
  .email('Введите корректный email')
  .transform(normalizeEmail);

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

export const signInSchema = object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = object({
  email: emailSchema,
  password: passwordSchema.regex(
    PASSWORD_UPPERCASE_REGEX,
    'Пароль должен содержать хотя бы одну заглавную букву',
  ),
  confirmPassword: string(),
}).superRefine(({ password, confirmPassword }, context) => {
  if (confirmPassword !== password) {
    context.addIssue({
      code: 'custom',
      message: 'Пароли должны совпадать',
      path: ['confirmPassword'],
    });
  }
});
