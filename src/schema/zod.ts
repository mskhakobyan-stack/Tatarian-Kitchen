import { object, string } from 'zod';

import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_UPPERCASE_REGEX,
  normalizeEmail,
} from '@/auth/auth-validation';
import {
  Category,
  Unit,
  type Category as CategoryValue,
  type Unit as UnitValue,
} from '@/generated/prisma/enums';

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

function isCategoryValue(value: string): value is CategoryValue {
  return Object.values(Category).includes(value as CategoryValue);
}

function isUnitValue(value: string): value is UnitValue {
  return Object.values(Unit).includes(value as UnitValue);
}

function parsePrice(value: string): number {
  return Number(value.trim().replace(',', '.'));
}

const ingredientNameSchema = string()
  .trim()
  .min(1, 'Поле обязательно для заполнения')
  .max(80, 'Название должно содержать не более 80 символов');

const ingredientCategorySchema = string()
  .trim()
  .refine(isCategoryValue, 'Выберите категорию')
  .transform((value) => value as CategoryValue);

const ingredientUnitSchema = string()
  .trim()
  .refine(isUnitValue, 'Выберите единицу измерения')
  .transform((value) => value as UnitValue);

const ingredientPriceSchema = string()
  .trim()
  .min(1, 'Укажите цену ингредиента')
  .refine((value) => !Number.isNaN(parsePrice(value)), 'Введите число')
  .transform(parsePrice)
  .refine((value) => value >= 0, 'Цена не может быть отрицательной');

const ingredientDescriptionSchema = string()
  .trim()
  .min(1, 'Добавьте короткое описание ингредиента')
  .min(10, 'Описание должно содержать минимум 10 символов')
  .max(300, 'Описание должно содержать не более 300 символов');

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

/**
 * Схема ингредиента приводит значения формы к тем типам, которые уже ожидает БД.
 */
export const ingredientSchema = object({
  category: ingredientCategorySchema,
  description: ingredientDescriptionSchema,
  name: ingredientNameSchema,
  price: ingredientPriceSchema,
  unit: ingredientUnitSchema,
});
