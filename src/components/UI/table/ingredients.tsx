'use client';

import { useState, type FormEvent } from 'react';
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
  destructiveButtonClassName,
  filledButtonClassName,
  formFieldClassName,
  formSurfaceClassName,
  panelSurfaceClassName,
  selectTriggerClassName,
  softButtonClassName,
  tableBodyCellClassName,
  tableBodyRowClassName,
  tableHeaderCellClassName,
  tableShellClassName,
  textAreaClassName,
} from '@/components/UI/ui-theme';
import {
  CATEGORY_OPTIONS,
  getCategoryLabel,
  UNIT_OPTIONS,
} from '@/lib/ingredient-form';
import { getUnitLabel } from '@/lib/ingredient-units';
import { useItemMutationState } from '@/components/UI/use-item-mutation-state';
import {
  initialIngredientFormState,
  type IngredientFormFields,
  type IngredientFormState,
  type SavedIngredient,
} from '@/types/ingredient-form';

interface IngredientsTableProps {
  currentUserId: string | null;
  ingredients: SavedIngredient[];
  onIngredientDeleted: (ingredientId: string) => void;
  onIngredientUpdated: (ingredient: SavedIngredient) => void;
}

const PRICE_FORMATTER = new Intl.NumberFormat('ru-RU', {
  currency: 'RUB',
  maximumFractionDigits: 2,
  style: 'currency',
});

function getEmptyIngredientsMessage(currentUserId: string | null): string {
  return currentUserId
    ? 'Таблица пока пустая. Добавьте первый ингредиент через форму выше.'
    : 'Таблица пока пустая. Войдите в аккаунт, чтобы добавить первый ингредиент.';
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
  currentUserId,
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
  const {
    isItemPending,
    setErrorMessage,
    setSuccessMessage,
    runForItem,
    statusMessage,
    statusTone,
  } = useItemMutationState();

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

    runForItem(ingredient.id, async () => {
      const result = await deleteIngredient(ingredient.id);

      if (result.status === 'success' && result.deletedIngredientId) {
        onIngredientDeleted(result.deletedIngredientId);
        setSuccessMessage(`Ингредиент «${ingredient.name}» удалён.`);
      } else {
        setErrorMessage(result.message);
      }
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingIngredient) {
      return;
    }

    const fields = getEditFormValues(new FormData(event.currentTarget));

    runForItem(editingIngredient.id, async () => {
      const result = await updateIngredient(editingIngredient.id, fields);

      if (result.status === 'success' && result.ingredient) {
        onIngredientUpdated(result.ingredient);
        setSuccessMessage(`Ингредиент «${result.ingredient.name}» обновлён.`);
        closeEditModal();
      } else {
        setEditState(result);
      }
    });
  };

  return (
    <section
      className={`flex w-full flex-col gap-4 ${panelSurfaceClassName} p-6`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#5a3110]">
            Добавленные ингредиенты
          </h2>
          <p className="text-sm leading-6 text-[#7a532a]">
            Новые записи появляются здесь сразу после отправки формы.
          </p>
        </div>
        <p className="rounded-full border border-[#e1c795] bg-[#fff2da] px-3 py-1.5 text-sm font-medium text-[#6a3b14] shadow-[0_10px_24px_-20px_rgba(96,53,11,0.55)]">
          Всего ингредиентов: {ingredients.length}
        </p>
      </div>

      <FormStatusMessage message={statusMessage} tone={statusTone} />

      <Table className={`w-full ${tableShellClassName}`}>
        <Table.ScrollContainer className="rounded-[28px]">
          <Table.Content
            aria-label="Список ингредиентов"
            className="min-w-full overflow-hidden"
          >
            <Table.Header>
              <Table.Column className={tableHeaderCellClassName} isRowHeader>
                Название
              </Table.Column>
              <Table.Column className={tableHeaderCellClassName}>
                Категория
              </Table.Column>
              <Table.Column className={tableHeaderCellClassName}>
                Ед. изм.
              </Table.Column>
              <Table.Column className={tableHeaderCellClassName}>
                Цена
              </Table.Column>
              <Table.Column className={tableHeaderCellClassName}>
                Описание
              </Table.Column>
              <Table.Column className={tableHeaderCellClassName}>
                Действия
              </Table.Column>
            </Table.Header>

            <Table.Body
              items={ingredients}
              renderEmptyState={() => (
                <div className="px-4 py-10 text-center text-sm text-[#7a532a]">
                  {getEmptyIngredientsMessage(currentUserId)}
                </div>
              )}
            >
              {(ingredient) => (
                (() => {
                  const isOwnedByCurrentUser =
                    Boolean(currentUserId)
                    && ingredient.ownerId === currentUserId;

                  return (
                    <Table.Row className={tableBodyRowClassName} id={ingredient.id}>
                      <Table.Cell className={tableBodyCellClassName}>
                        <span className="font-semibold text-[#5a3110]">
                          {ingredient.name}
                        </span>
                      </Table.Cell>
                      <Table.Cell className={tableBodyCellClassName}>
                        {getCategoryLabel(ingredient.category)}
                      </Table.Cell>
                      <Table.Cell className={tableBodyCellClassName}>
                        {getUnitLabel(ingredient.unit)}
                      </Table.Cell>
                      <Table.Cell className={tableBodyCellClassName}>
                        {PRICE_FORMATTER.format(ingredient.price)}
                      </Table.Cell>
                      <Table.Cell className={tableBodyCellClassName}>
                        <span className="max-w-md whitespace-normal text-sm leading-6 text-[#6a4a26]">
                          {ingredient.description}
                        </span>
                      </Table.Cell>
                      <Table.Cell className={tableBodyCellClassName}>
                        {isOwnedByCurrentUser ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className={softButtonClassName}
                              isDisabled={isItemPending(ingredient.id)}
                              onPress={() => openEditModal(ingredient)}
                              variant="secondary"
                            >
                              Редактировать
                            </Button>
                            <Button
                              className={destructiveButtonClassName}
                              isDisabled={isItemPending(ingredient.id)}
                              onPress={() => handleDelete(ingredient)}
                              variant="secondary"
                            >
                              Удалить
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#9b7855]">
                            {currentUserId ? 'Только автор' : 'После входа'}
                          </span>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  );
                })()
              )}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>

      {editingIngredient ? (
        <Modal state={editModalState}>
          <Modal.Backdrop>
            <Modal.Container placement="center" size="lg">
              <Modal.Dialog
                className={`${formSurfaceClassName} overflow-hidden`}
              >
                <Modal.Header className="items-center justify-between border-b border-[#efe2d5] bg-[#fff8f1]/70 px-6 py-4">
                  <Modal.Heading>Редактирование ингредиента</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body className="bg-[#fffdfa]/56 px-6 py-5">
                  <Form
                    key={editingIngredient.id}
                    className="flex flex-col gap-4"
                    onSubmit={handleEditSubmit}
                  >
                    <TextField
                      aria-label="Название ингредиента"
                      defaultValue={editingIngredient.name}
                      isRequired
                      name="name"
                    >
                      <Input
                        className={formFieldClassName}
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
                        <FieldServerError message={editState.errors.category?.[0]} />
                      </Select>

                      <Select
                        aria-label="Единица измерения ингредиента"
                        defaultSelectedKey={editingIngredient.unit}
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
                          className={formFieldClassName}
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
                        className={`${textAreaClassName} resize-none overflow-hidden`}
                        maxLength={300}
                        placeholder="Описание ингредиента: вкус, применение или особенности"
                        rows={3}
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
                        className={filledButtonClassName}
                        isDisabled={isItemPending(editingIngredient.id)}
                        type="submit"
                      >
                        {isItemPending(editingIngredient.id)
                          ? 'Сохранение...'
                          : 'Сохранить'}
                      </Button>
                      <Button
                        className={softButtonClassName}
                        isDisabled={isItemPending(editingIngredient.id)}
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
