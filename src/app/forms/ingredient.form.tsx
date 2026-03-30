'use client';

import { useState, type FormEvent } from 'react';
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  SuccessIcon,
  TextArea,
  TextField,
} from '@heroui/react';

import { FormStatusMessage } from '@/components/UI/form-feedback';
import {
  Category,
  Unit,
  type Category as CategoryValue,
  type Unit as UnitValue,
} from '@/generated/prisma/browser';

interface IngredientDraft {
  category: CategoryValue;
  description: string;
  name: string;
  price: number;
  unit: UnitValue;
}

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

const PRICE_FORMATTER = new Intl.NumberFormat('ru-RU', {
  currency: 'RUB',
  maximumFractionDigits: 2,
  style: 'currency',
});

function isCategoryValue(value: string): value is CategoryValue {
  return Object.values(Category).includes(value as CategoryValue);
}

function isUnitValue(value: string): value is UnitValue {
  return Object.values(Unit).includes(value as UnitValue);
}

function getCategoryLabel(category: CategoryValue): string {
  return CATEGORY_LABELS[category];
}

function getUnitLabel(unit: UnitValue): string {
  return UNIT_LABELS[unit];
}

/**
 * Безопасно достаём строку из `FormData`, чтобы форма не принимала `File`
 * и не разносила проверки по всему обработчику.
 */
function getFormValue(formData: FormData, key: keyof IngredientDraft): string {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Собираем все значения формы в одном месте и сразу приводим цену к числу.
 */
function getIngredientDraft(formElement: HTMLFormElement): IngredientDraft | null {
  const formData = new FormData(formElement);
  const category = getFormValue(formData, 'category');
  const price = Number.parseFloat(getFormValue(formData, 'price'));
  const unit = getFormValue(formData, 'unit');

  if (
    Number.isNaN(price) ||
    !isCategoryValue(category) ||
    !isUnitValue(unit)
  ) {
    return null;
  }

  return {
    category,
    description: getFormValue(formData, 'description'),
    name: getFormValue(formData, 'name'),
    price,
    unit,
  };
}

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
 * Клиентская форма собирает ввод по ингредиенту и показывает последнюю
 * отправленную запись прямо на странице, пока серверная часть ещё не нужна.
 */
export function IngredientForm() {
  const [formVersion, setFormVersion] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'error' | 'success'>('success');
  const [submittedIngredient, setSubmittedIngredient] =
    useState<IngredientDraft | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft = getIngredientDraft(event.currentTarget);

    if (!draft) {
      setStatusTone('error');
      setStatusMessage('Не удалось прочитать цену ингредиента.');
      return;
    }

    setSubmittedIngredient(draft);
    setStatusTone('success');
    setStatusMessage(`Ингредиент «${draft.name}» сохранён в форме.`);
    setFormVersion((current) => current + 1);
  };

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-6">
      <Form
        key={formVersion}
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur-sm lg:w-1/3"
        onSubmit={handleSubmit}
      >
        <TextField
          isRequired
          name="name"
          validate={validateRequiredValue}
        >
          <Label>Введите название ингредиента</Label>
          <Input
            className="h-11"
            maxLength={80}
            placeholder="Например, катык"
          />
          <Description>Короткое и понятное название продукта</Description>
          <FieldError />
        </TextField>

        <div className="grid w-full grid-cols-2 items-start gap-4 md:grid-cols-3">
          <Select
            isRequired
            name="category"
          >
            <Label>Категория</Label>
            <Select.Trigger className="h-11 justify-between">
              <Select.Value>
                {({ isPlaceholder, selectedText }) =>
                  isPlaceholder ? 'Выберите' : selectedText
                }
              </Select.Value>
              <Select.Indicator className="shrink-0 text-black/45" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {CATEGORY_OPTIONS.map(({ label, value }) => (
                  <ListBox.Item id={value} key={value}>
                    {label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError />
          </Select>

          <Select
            isRequired
            name="unit"
          >
            <Label>Ед. изм.</Label>
            <Select.Trigger className="h-11 justify-between">
              <Select.Value>
                {({ isPlaceholder, selectedText }) =>
                  isPlaceholder ? 'Выберите' : selectedText
                }
              </Select.Value>
              <Select.Indicator className="shrink-0 text-black/45" />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {UNIT_OPTIONS.map(({ label, value }) => (
                  <ListBox.Item id={value} key={value}>
                    {label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
            <FieldError />
          </Select>

          <TextField
            className="col-span-2 md:col-span-1"
            isRequired
            name="price"
            type="number"
            validate={validatePriceValue}
          >
            <Label>Цена</Label>
            <Input
              className="h-11"
              inputMode="decimal"
              min="0"
              placeholder="350"
              step="0.01"
            />
            <FieldError />
          </TextField>
        </div>

        <TextField
          isRequired
          name="description"
          validate={validateDescriptionValue}
        >
          <Label>Описание</Label>
          <TextArea
            maxLength={300}
            placeholder="Опишите вкус, применение или особенности ингредиента"
            rows={5}
          />
          <Description>
            Подойдёт короткая заметка о составе, вкусе или применении
          </Description>
          <FieldError />
        </TextField>

        <FormStatusMessage
          message={statusMessage}
          tone={statusTone}
        />

        <div className="flex">
          <Button type="submit">
            <SuccessIcon />
            Добавить ингредиент
          </Button>
        </div>
      </Form>

      {submittedIngredient ? (
        <section className="w-full max-w-4xl rounded-3xl border border-black/10 bg-amber-50/70 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight">
            Последний введённый ингредиент
          </h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <dt className="text-sm text-black/60">Название</dt>
              <dd className="text-base font-medium">{submittedIngredient.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-black/60">Категория</dt>
              <dd className="text-base font-medium">
                {getCategoryLabel(submittedIngredient.category)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-black/60">Ед. изм.</dt>
              <dd className="text-base font-medium">
                {getUnitLabel(submittedIngredient.unit)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-black/60">Цена</dt>
              <dd className="text-base font-medium">
                {PRICE_FORMATTER.format(submittedIngredient.price)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 max-w-3xl text-base leading-7 text-black/75">
            {submittedIngredient.description}
          </p>
        </section>
      ) : null}
    </div>
  );
}
