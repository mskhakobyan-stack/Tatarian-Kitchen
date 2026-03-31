'use client';

import { useState, useTransition, type FormEvent } from 'react';
import {
  Button,
  FieldError,
  Form,
  Input,
  ListBox,
  Modal,
  Select,
  Table,
  TextArea,
  TextField,
} from '@heroui/react';
import { useOverlayState } from '@heroui/react';

import {
  deleteIngredient,
  updateIngredient,
} from '@/actions/ingredient';
import {
  FieldServerError,
  FormStatusMessage,
} from '@/components/UI/form-feedback';
import {
  Category,
  Unit,
  type Category as CategoryValue,
  type Unit as UnitValue,
} from '@/generated/prisma/browser';
import {
  initialIngredientFormState,
  type IngredientFormFields,
  type IngredientFormState,
  type SavedIngredient,
} from '@/types/ingredient-form';

interface IngredientOption<T extends string> {
  label: string;
  value: T;
}

interface IngredientsTableProps {
  ingredients: SavedIngredient[];
  onIngredientDeleted: (ingredientId: string) => void;
  onIngredientUpdated: (ingredient: SavedIngredient) => void;
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

function getCategoryLabel(category: CategoryValue): string {
  return CATEGORY_LABELS[category];
}

function getUnitLabel(unit: UnitValue): string {
  return UNIT_LABELS[unit];
}

function getEditFormValues(formData: FormData): IngredientFormFields {
  const getValue = (key: keyof IngredientFormFields) => {
    const value = formData.get(key);

    return typeof value === 'string' ? value : '';
  };

  return {
    category: getValue('category'),
    description: getValue('description'),
    name: getValue('name'),
    price: getValue('price'),
    unit: getValue('unit'),
  };
}

/**
 * Таблица под формой показывает все сохранённые ингредиенты и даёт быстрые
 * действия по редактированию и удалению.
 */
export function IngredientsTable({
  ingredients,
  onIngredientDeleted,
  onIngredientUpdated,
}: IngredientsTableProps) {
  const editModalState = useOverlayState();
  const [editingIngredient, setEditingIngredient] =
    useState<SavedIngredient | null>(null);
  const [editState, setEditState] = useState<IngredientFormState>(
    initialIngredientFormState,
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'error' | 'success'>('success');
  const [pendingIngredientId, setPendingIngredientId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const openEditModal = (ingredient: SavedIngredient) => {
    setEditingIngredient(ingredient);
    setEditState(initialIngredientFormState);
    editModalState.open();
  };

  const closeEditModal = () => {
    setEditingIngredient(null);
    setEditState(initialIngredientFormState);
    editModalState.close();
  };

  const handleDelete = (ingredient: SavedIngredient) => {
    if (!window.confirm(`Удалить ингредиент «${ingredient.name}»?`)) {
      return;
    }

    setPendingIngredientId(ingredient.id);
    startTransition(async () => {
      const result = await deleteIngredient(ingredient.id);

      if (result.status === 'success' && result.deletedIngredientId) {
        onIngredientDeleted(result.deletedIngredientId);
        setStatusTone('success');
        setStatusMessage(`Ингредиент «${ingredient.name}» удалён.`);
      } else {
        setStatusTone('error');
        setStatusMessage(result.message);
      }

      setPendingIngredientId(null);
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingIngredient) {
      return;
    }

    const fields = getEditFormValues(new FormData(event.currentTarget));
    setPendingIngredientId(editingIngredient.id);

    startTransition(async () => {
      const result = await updateIngredient(editingIngredient.id, fields);

      if (result.status === 'success' && result.ingredient) {
        onIngredientUpdated(result.ingredient);
        setStatusTone('success');
        setStatusMessage(`Ингредиент «${result.ingredient.name}» обновлён.`);
        closeEditModal();
      } else {
        setEditState(result);
      }

      setPendingIngredientId(null);
    });
  };

  return (
    <section className="flex w-full flex-col gap-4 rounded-3xl border border-black/10 bg-white/75 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Добавленные ингредиенты
          </h2>
          <p className="text-sm leading-6 text-black/65">
            Новые записи появляются здесь сразу после отправки формы.
          </p>
        </div>
        <p className="text-sm font-medium text-black/55">
          Всего ингредиентов: {ingredients.length}
        </p>
      </div>

      <FormStatusMessage message={statusMessage} tone={statusTone} />

      <Table className="w-full">
        <Table.ScrollContainer>
          <Table.Content aria-label="Список ингредиентов">
            <Table.Header>
              <Table.Column isRowHeader>Название</Table.Column>
              <Table.Column>Категория</Table.Column>
              <Table.Column>Ед. изм.</Table.Column>
              <Table.Column>Цена</Table.Column>
              <Table.Column>Описание</Table.Column>
              <Table.Column>Действия</Table.Column>
            </Table.Header>

            <Table.Body
              items={ingredients}
              renderEmptyState={() => (
                <div className="px-4 py-10 text-center text-sm text-black/55">
                  Таблица пока пустая. Добавьте первый ингредиент через форму выше.
                </div>
              )}
            >
              {(ingredient) => (
                <Table.Row id={ingredient.id}>
                  <Table.Cell>{ingredient.name}</Table.Cell>
                  <Table.Cell>{getCategoryLabel(ingredient.category)}</Table.Cell>
                  <Table.Cell>{getUnitLabel(ingredient.unit)}</Table.Cell>
                  <Table.Cell>{PRICE_FORMATTER.format(ingredient.price)}</Table.Cell>
                  <Table.Cell>
                    <span className="max-w-md whitespace-normal text-sm leading-6 text-black/70">
                      {ingredient.description}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        isDisabled={
                          isPending && pendingIngredientId === ingredient.id
                        }
                        onPress={() => openEditModal(ingredient)}
                        variant="secondary"
                      >
                        Редактировать
                      </Button>
                      <Button
                        className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        isDisabled={
                          isPending && pendingIngredientId === ingredient.id
                        }
                        onPress={() => handleDelete(ingredient)}
                        variant="secondary"
                      >
                        Удалить
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {editingIngredient ? (
        <Modal state={editModalState}>
          <Modal.Backdrop>
            <Modal.Container placement="center" size="lg">
              <Modal.Dialog>
                <Modal.Header className="items-center justify-between">
                  <Modal.Heading>Редактирование ингредиента</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body>
                  <Form
                    key={editingIngredient.id}
                    className="flex flex-col gap-2"
                    onSubmit={handleEditSubmit}
                  >
                    <TextField
                      aria-label="Название ингредиента"
                      defaultValue={editingIngredient.name}
                      isRequired
                      name="name"
                    >
                      <Input
                        className="h-11"
                        maxLength={80}
                        placeholder="Название ингредиента, например катык"
                      />
                      <FieldError />
                      <FieldServerError message={editState.errors.name?.[0]} />
                    </TextField>

                    <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-3">
                      <Select
                        aria-label="Категория ингредиента"
                        defaultSelectedKey={editingIngredient.category}
                        isRequired
                        name="category"
                        placeholder="Категория"
                      >
                        <Select.Trigger className="h-11 justify-between">
                          <Select.Value />
                          <Select.Indicator className="shrink-0 text-black/45" />
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
                        <FieldServerError message={editState.errors.category?.[0]} />
                      </Select>

                      <Select
                        aria-label="Единица измерения ингредиента"
                        defaultSelectedKey={editingIngredient.unit}
                        isRequired
                        name="unit"
                        placeholder="Единица измерения"
                      >
                        <Select.Trigger className="h-11 justify-between">
                          <Select.Value />
                          <Select.Indicator className="shrink-0 text-black/45" />
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
                        <FieldServerError message={editState.errors.unit?.[0]} />
                      </Select>

                      <TextField
                        aria-label="Цена ингредиента"
                        className="col-span-2 md:col-span-1"
                        defaultValue={editingIngredient.price.toString()}
                        isRequired
                        name="price"
                        type="number"
                      >
                        <Input
                          className="h-11"
                          inputMode="decimal"
                          min="0"
                          placeholder="Цена, например 350"
                          step="0.01"
                        />
                        <FieldError />
                        <FieldServerError message={editState.errors.price?.[0]} />
                      </TextField>
                    </div>

                    <TextField
                      aria-label="Описание ингредиента"
                      defaultValue={editingIngredient.description}
                      isRequired
                      name="description"
                    >
                      <TextArea
                        className="h-11 min-h-11 resize-none overflow-hidden"
                        maxLength={300}
                        placeholder="Описание ингредиента: вкус, применение или особенности"
                        rows={1}
                      />
                      <FieldError />
                      <FieldServerError message={editState.errors.description?.[0]} />
                    </TextField>

                    <FormStatusMessage
                      message={editState.message}
                      tone={editState.status === 'success' ? 'success' : 'error'}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        isDisabled={
                          isPending && pendingIngredientId === editingIngredient.id
                        }
                        type="submit"
                      >
                        {isPending && pendingIngredientId === editingIngredient.id
                          ? 'Сохранение...'
                          : 'Сохранить'}
                      </Button>
                      <Button
                        isDisabled={
                          isPending && pendingIngredientId === editingIngredient.id
                        }
                        onPress={closeEditModal}
                        type="button"
                        variant="secondary"
                      >
                        Отмена
                      </Button>
                    </div>
                  </Form>
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}
    </section>
  );
}
