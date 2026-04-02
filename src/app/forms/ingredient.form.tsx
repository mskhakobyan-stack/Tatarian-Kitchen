'use client';

import { useActionState } from 'react';
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
import { useReportedFormSuccess } from '@/app/forms/use-reported-form-success';
import {
  CATEGORY_OPTIONS,
  UNIT_OPTIONS,
  validateIngredientDescription,
  validateIngredientName,
  validateIngredientPrice,
} from '@/lib/ingredient-form';
import {
  initialIngredientFormState,
  type SavedIngredient,
} from '@/types/ingredient-form';

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

  /**
   * После успешного сохранения синхронизируем локальный список родителя
   * без полной перезагрузки страницы.
   */
  useReportedFormSuccess(
    state.status,
    state.ingredient,
    onIngredientCreated,
  );

  return (
    <div className="mt-4 flex w-full flex-col gap-4">
      <Form
        action={formAction}
        key={state.ingredient?.id ?? 'ingredient-form'}
        className={`flex w-full flex-col gap-4 ${formSurfaceClassName} p-6`}
      >
        {/* Название показываем отдельным полем, потому что это главный идентификатор записи в UI. */}
        <TextField
          aria-label="Название ингредиента"
          isRequired
          name="name"
          validate={validateIngredientName}
        >
          <Input
            className={formFieldClassName}
            maxLength={80}
            placeholder="Название ингредиента, например катык"
          />
          <FieldError />
          <FieldServerError message={state.errors.name?.[0]} />
        </TextField>

        {/* Категория, единица и цена собраны в одну строку как основные структурные атрибуты. */}
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
            validate={validateIngredientPrice}
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

        {/* Описание хранит пользовательский контекст: вкус, назначение и заметки по продукту. */}
        <TextField
          aria-label="Описание ингредиента"
          isRequired
          name="description"
          validate={validateIngredientDescription}
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

        {/* В этой форме достаточно одной primary-кнопки, потому что reset делает сам браузер. */}
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
