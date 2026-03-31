'use client';

import { useActionState, useEffect, useRef } from 'react';
import {
  Button,
  FieldError,
  Form,
  Input,
  ListBox,
  Select,
  SuccessIcon,
  TextArea,
  TextField,
} from '@heroui/react';

import { createIngredient } from '@/actions/ingredient';
import {
  FieldServerError,
  FormStatusMessage,
} from '@/components/UI/form-feedback';
import {
  filledButtonClassName,
  formFieldClassName,
  formSurfaceClassName,
  selectTriggerClassName,
  textAreaClassName,
} from '@/components/UI/ui-theme';
import {
  Category,
  Unit,
  type Category as CategoryValue,
  type Unit as UnitValue,
} from '@/generated/prisma/browser';
import {
  initialIngredientFormState,
  type SavedIngredient,
} from '@/types/ingredient-form';

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

const UNIT_LABELS: Record<UnitValue, string> = {
  [Unit.GRAM]: 'г',
  [Unit.KILOGRAM]: 'кг',
  [Unit.LITER]: 'л',
  [Unit.MILLILITER]: 'мл',
  [Unit.PIECE]: 'шт',
};

const CATEGORY_OPTIONS: IngredientOption<CategoryValue>[] = Object.values(
  Category,
).map((value) => ({
  label: CATEGORY_LABELS[value],
  value,
}));

const UNIT_OPTIONS: IngredientOption<UnitValue>[] = Object.values(Unit).map(
  (value) => ({
    label: UNIT_LABELS[value],
    value,
  }),
);

function validateRequiredValue(value: string): string | null {
  if (!value.trim()) {
    return 'Поле обязательно для заполнения';
  }

  return null;
}

function validatePriceValue(value: string): string | null {
  if (!value.trim()) {
    return 'Укажите цену ингредиента';
  }

  const price = Number.parseFloat(value);

  if (Number.isNaN(price)) {
    return 'Введите число';
  }

  if (price < 0) {
    return 'Цена не может быть отрицательной';
  }

  return null;
}

function validateDescriptionValue(value: string): string | null {
  if (!value.trim()) {
    return 'Добавьте короткое описание ингредиента';
  }

  if (value.trim().length < 10) {
    return 'Описание должно содержать минимум 10 символов';
  }

  return null;
}

/**
 * Клиентская форма запускает серверный action и сообщает родителю о новой
 * записи, чтобы таблица под формой обновлялась сразу же.
 */
interface IngredientFormProps {
  onIngredientCreated?: (ingredient: SavedIngredient) => void;
}

export function IngredientForm({ onIngredientCreated }: IngredientFormProps) {
  const [state, formAction, pending] = useActionState(
    createIngredient,
    initialIngredientFormState,
  );
  const lastReportedIngredientIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (state.status !== 'success' || !state.ingredient) {
      return;
    }

    if (lastReportedIngredientIdRef.current === state.ingredient.id) {
      return;
    }

    lastReportedIngredientIdRef.current = state.ingredient.id;
    onIngredientCreated?.(state.ingredient);
  }, [onIngredientCreated, state.ingredient, state.status]);

  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <Form
        action={formAction}
        key={state.ingredient?.id ?? 'ingredient-form'}
        className={`flex w-full flex-col gap-4 ${formSurfaceClassName} p-6`}
      >
        <TextField
          aria-label="Название ингредиента"
          isRequired
          name="name"
          validate={validateRequiredValue}
        >
          <Input
            className={formFieldClassName}
            maxLength={80}
            placeholder="Название ингредиента, например катык"
          />
          <FieldError />
          <FieldServerError message={state.errors.name?.[0]} />
        </TextField>

        <div className="grid w-full grid-cols-2 items-start gap-2 md:grid-cols-3">
          <Select
            aria-label="Категория ингредиента"
            isRequired
            name="category"
            placeholder="Категория"
          >
            <Select.Trigger className={selectTriggerClassName}>
              <Select.Value />
              <Select.Indicator className="shrink-0 text-[#9a744a]" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {CATEGORY_OPTIONS.map(({ label, value }) => (
                  <ListBox.Item
                    id={value}
                    key={value}
                    textValue={label}
                  >
                    {label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError />
            <FieldServerError message={state.errors.category?.[0]} />
          </Select>

          <Select
            aria-label="Единица измерения ингредиента"
            isRequired
            name="unit"
            placeholder="Единица измерения"
          >
            <Select.Trigger className={selectTriggerClassName}>
              <Select.Value />
              <Select.Indicator className="shrink-0 text-[#9a744a]" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {UNIT_OPTIONS.map(({ label, value }) => (
                  <ListBox.Item
                    id={value}
                    key={value}
                    textValue={label}
                  >
                    {label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError />
            <FieldServerError message={state.errors.unit?.[0]} />
          </Select>

          <TextField
            aria-label="Цена ингредиента"
            className="col-span-2 md:col-span-1"
            isRequired
            name="price"
            type="number"
            validate={validatePriceValue}
          >
            <Input
              className={formFieldClassName}
              inputMode="decimal"
              min="0"
              placeholder="Цена, например 350"
              step="0.01"
            />
            <FieldError />
            <FieldServerError message={state.errors.price?.[0]} />
          </TextField>
        </div>

        <TextField
          aria-label="Описание ингредиента"
          isRequired
          name="description"
          validate={validateDescriptionValue}
        >
          <TextArea
            className={`${textAreaClassName} resize-none overflow-hidden`}
            maxLength={300}
            placeholder="Описание ингредиента: вкус, применение или особенности"
            rows={3}
          />
          <FieldError />
          <FieldServerError message={state.errors.description?.[0]} />
        </TextField>

        <FormStatusMessage
          message={state.message}
          tone={state.status === 'success' ? 'success' : 'error'}
        />

        <div className="flex">
          <Button
            className={filledButtonClassName}
            isDisabled={pending}
            type="submit"
          >
            <SuccessIcon />
            {pending ? 'Сохранение...' : 'Добавить ингредиент'}
          </Button>
        </div>
      </Form>
    </div>
  );
}
