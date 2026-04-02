import {
  Category,
  Unit,
  type Category as CategoryValue,
  type Unit as UnitValue,
} from '@/generated/prisma/enums';
import { getUnitLabel } from '@/lib/ingredient-units';

interface IngredientOption<T extends string> {
  label: string;
  value: T;
}

const CATEGORY_LABELS: Record<CategoryValue, string> = {
  [Category.VEGETABLE]: 'Овощи',
  [Category.FRUIT]: 'Фрукты',
  [Category.MEAT]: 'Мясо',
  [Category.DAIRY]: 'Молочные продукты',
  [Category.GRAIN]: 'Крупы',
  [Category.OTHER]: 'Другое',
};

export const CATEGORY_OPTIONS: IngredientOption<CategoryValue>[] = Object.values(
  Category,
).map((value) => ({
  label: CATEGORY_LABELS[value],
  value,
}));

export const UNIT_OPTIONS: IngredientOption<UnitValue>[] = Object.values(Unit).map(
  (value) => ({
    label: getUnitLabel(value),
    value,
  }),
);

/**
 * Таблица и формы должны одинаково подписывать категории, поэтому справочник
 * держим в одном клиентском helper-е.
 */
export function getCategoryLabel(category: CategoryValue): string {
  return CATEGORY_LABELS[category];
}

/**
 * Простая клиентская проверка названия помогает поймать пустое поле
 * ещё до server action.
 */
export function validateIngredientName(value: string): string | null {
  if (!value.trim()) {
    return 'Поле обязательно для заполнения';
  }

  return null;
}

/**
 * Цену заранее ограничиваем только базовыми правилами, а окончательная
 * проверка всё равно остаётся на сервере.
 */
export function validateIngredientPrice(value: string): string | null {
  if (!value.trim()) {
    return 'Укажите цену ингредиента';
  }

  const price = Number(value.trim().replace(',', '.'));

  if (Number.isNaN(price)) {
    return 'Введите число';
  }

  if (price < 0) {
    return 'Цена не может быть отрицательной';
  }

  return null;
}

/**
 * Короткое описание ингредиента полезно и в create-, и в edit-форме,
 * поэтому используем одно правило минимальной длины.
 */
export function validateIngredientDescription(value: string): string | null {
  if (!value.trim()) {
    return 'Добавьте короткое описание ингредиента';
  }

  if (value.trim().length < 10) {
    return 'Описание должно содержать минимум 10 символов';
  }

  return null;
}
