/* eslint-disable @next/next/no-img-element */

'use client';

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from 'react';
import {
  Button,
  FieldError,
  Form,
  Input,
  Modal,
  SuccessIcon,
  TextArea,
  TextField,
} from '@heroui/react';
import { Card, useOverlayState } from '@heroui/react';

import { deleteRecipe, updateRecipe } from '@/actions/recipe';
import {
  FieldServerError,
  FormStatusMessage,
} from '@/components/UI/form-feedback';
import { RecipeImagePreview } from '@/components/UI/recipe-image-preview';
import { RecipeIngredientFields } from '@/components/UI/recipe-ingredient-fields';
import {
  destructiveButtonClassName,
  fileInputClassName,
  filledButtonClassName,
  formFieldClassName,
  formSurfaceClassName,
  panelSurfaceClassName,
  softButtonClassName,
  textAreaClassName,
} from '@/components/UI/ui-theme';
import { getUnitLabel } from '@/lib/ingredient-units';
import { isUploadedRecipeImage } from '@/lib/recipe-images';
import {
  createEmptyRecipeIngredientDraft,
  initialRecipeFormState,
  type RecipeFormState,
  type RecipeImageSource,
  type RecipeIngredientOption,
  type SavedRecipe,
} from '@/types/recipe-form';

interface RecipeCardsProps {
  availableIngredients: RecipeIngredientOption[];
  canManage: boolean;
  onRecipeDeleted: (recipeId: string) => void;
  onRecipeUpdated: (recipe: SavedRecipe) => void;
  recipes: SavedRecipe[];
}

function validateRecipeName(value: string): string | null {
  if (!value.trim()) {
    return 'Название рецепта обязательно';
  }

  return null;
}

function validateRecipeDescription(value: string): string | null {
  if (!value.trim()) {
    return 'Добавьте описание рецепта';
  }

  if (value.trim().length < 20) {
    return 'Описание должно содержать минимум 20 символов';
  }

  return null;
}

function validateImageUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 'Добавьте ссылку на изображение';
  }

  try {
    const url = new URL(trimmedValue);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'Ссылка должна начинаться с http:// или https://';
    }
  } catch {
    return 'Введите корректную ссылку';
  }

  return null;
}

/**
 * Сетка карточек показывает рецепты всем пользователям, а CRUD-кнопки оставляет
 * только авторизованным.
 */
export function RecipeCards({
  availableIngredients = [],
  canManage,
  onRecipeDeleted,
  onRecipeUpdated,
  recipes,
}: RecipeCardsProps) {
  const editModalState = useOverlayState();
  const [editingRecipe, setEditingRecipe] = useState<SavedRecipe | null>(null);
  const [editState, setEditState] = useState<RecipeFormState>(
    initialRecipeFormState,
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [statusTone, setStatusTone] = useState<'error' | 'success'>('success');
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editImageSource, setEditImageSource] = useState<RecipeImageSource>('url');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [editSelectedFileName, setEditSelectedFileName] = useState('');
  const [editIngredientRows, setEditIngredientRows] = useState([
    createEmptyRecipeIngredientDraft(),
  ]);
  const editFilePreviewObjectUrlRef = useRef<string | null>(null);

  const resetEditPreview = () => {
    if (editFilePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(editFilePreviewObjectUrlRef.current);
      editFilePreviewObjectUrlRef.current = null;
    }

    setEditSelectedFileName('');
  };

  const openEditModal = (recipe: SavedRecipe) => {
    resetEditPreview();
    setEditingRecipe(recipe);
    setEditState(initialRecipeFormState);
    setEditImageSource(isUploadedRecipeImage(recipe.imageUrl) ? 'file' : 'url');
    setEditImageUrl(isUploadedRecipeImage(recipe.imageUrl) ? '' : recipe.imageUrl);
    setEditPreviewUrl(recipe.imageUrl);
    setEditIngredientRows(
      recipe.ingredients.length
        ? recipe.ingredients.map((ingredient) => ({
            ingredientId: ingredient.ingredientId,
            quantity: ingredient.quantity.toString(),
          }))
        : [createEmptyRecipeIngredientDraft()],
    );
    editModalState.open();
  };

  const closeEditModal = () => {
    resetEditPreview();
    setEditingRecipe(null);
    setEditState(initialRecipeFormState);
    setEditImageSource('url');
    setEditImageUrl('');
    setEditPreviewUrl('');
    setEditIngredientRows([createEmptyRecipeIngredientDraft()]);
    editModalState.close();
  };

  useEffect(() => {
    return () => {
      if (editFilePreviewObjectUrlRef.current) {
        URL.revokeObjectURL(editFilePreviewObjectUrlRef.current);
      }
    };
  }, []);

  const handleDelete = (recipe: SavedRecipe) => {
    if (!window.confirm(`Удалить рецепт «${recipe.name}»?`)) {
      return;
    }

    setPendingRecipeId(recipe.id);

    startTransition(async () => {
      const result = await deleteRecipe(recipe.id);

      if (result.status === 'success' && result.deletedRecipeId) {
        onRecipeDeleted(result.deletedRecipeId);
        setStatusTone('success');
        setStatusMessage(`Рецепт «${recipe.name}» удалён.`);
      } else {
        setStatusTone('error');
        setStatusMessage(result.message);
      }

      setPendingRecipeId(null);
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingRecipe) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setPendingRecipeId(editingRecipe.id);

    startTransition(async () => {
      const result = await updateRecipe(editingRecipe.id, formData);

      if (result.status === 'success' && result.recipe) {
        onRecipeUpdated(result.recipe);
        setStatusTone('success');
        setStatusMessage(`Рецепт «${result.recipe.name}» обновлён.`);
        closeEditModal();
      } else {
        setEditState(result);
      }

      setPendingRecipeId(null);
    });
  };

  return (
    <section className={`flex w-full flex-col gap-4 ${panelSurfaceClassName} p-6`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#5a3110]">
            Подборка рецептов
          </h2>
          <p className="text-sm leading-6 text-[#7a532a]">
            Карточки блюд с изображением, описанием и составом из сохранённых ингредиентов.
          </p>
        </div>
        <p className="rounded-full border border-[#e1c795] bg-[#fff2da] px-3 py-1.5 text-sm font-medium text-[#6a3b14] shadow-[0_10px_24px_-20px_rgba(96,53,11,0.55)]">
          Всего рецептов: {recipes.length}
        </p>
      </div>

      {!canManage ? (
        <p className="rounded-2xl border border-[#eadbcc] bg-[#fffdfa]/56 px-4 py-3 text-sm leading-6 text-[#8b6742]">
          Просматривать рецепты можно всем, а добавлять и редактировать их —
          только после входа в аккаунт.
        </p>
      ) : null}

      <FormStatusMessage message={statusMessage} tone={statusTone} />

      {recipes.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="overflow-hidden rounded-[28px] border border-[#eadbcc] bg-[#fffdfa]/76 text-[#6a4524] shadow-[0_22px_38px_-30px_rgba(96,53,11,0.28)] backdrop-blur-sm"
            >
              <div className="border-b border-[#efe2d5] bg-[#fff7ee]/72">
                <img
                  alt={recipe.name}
                  className="aspect-[4/3] h-full w-full object-cover"
                  loading="lazy"
                  src={recipe.imageUrl}
                />
              </div>
              <Card.Header className="flex flex-col items-start gap-2 px-5 pt-5">
                <Card.Title className="text-xl font-semibold tracking-tight text-[#5a3110]">
                  {recipe.name}
                </Card.Title>
                <Card.Description className="text-sm leading-6 text-[#8a6844]">
                  Состав из базы ингредиентов
                </Card.Description>
              </Card.Header>
              <Card.Content className="flex flex-col gap-4 px-5 pb-4">
                <p className="line-clamp-4 text-sm leading-6 text-[#6a4a26]">
                  {recipe.description}
                </p>

                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b7855]">
                    Ингредиенты
                  </p>
                  {recipe.ingredients.length ? (
                    <ul className="flex flex-col gap-2">
                      {recipe.ingredients.map((ingredient) => (
                        <li
                          key={`${recipe.id}-${ingredient.ingredientId}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[#efe1d2] bg-[#fff8f0]/68 px-3 py-2 text-sm text-[#6a4a26]"
                        >
                          <span>{ingredient.ingredientName}</span>
                          <span className="whitespace-nowrap text-[#8b6742]">
                            {ingredient.quantity} {getUnitLabel(ingredient.unit)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-[#e7d7c7] bg-[#fffdf9]/52 px-3 py-3 text-sm leading-6 text-[#8b6742]">
                      Состав для этого рецепта пока не указан.
                    </p>
                  )}
                </div>
              </Card.Content>
              {canManage ? (
                <Card.Footer className="flex gap-2 border-t border-[#efe2d5] bg-[#fff8f1]/70 px-5 py-4">
                  <Button
                    className={softButtonClassName}
                    isDisabled={isPending && pendingRecipeId === recipe.id}
                    onPress={() => openEditModal(recipe)}
                    variant="secondary"
                  >
                    Редактировать
                  </Button>
                  <Button
                    className={destructiveButtonClassName}
                    isDisabled={isPending && pendingRecipeId === recipe.id}
                    onPress={() => handleDelete(recipe)}
                    variant="secondary"
                  >
                    Удалить
                  </Button>
                </Card.Footer>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#e5d1ba] bg-[#fffdfa]/48 px-6 py-12 text-center text-sm leading-6 text-[#8b6742]">
          Рецептов пока нет. Добавьте первую карточку через форму выше.
        </div>
      )}

      {editingRecipe ? (
        <Modal state={editModalState}>
          <Modal.Backdrop>
            <Modal.Container placement="center" size="lg">
              <Modal.Dialog className={`${formSurfaceClassName} overflow-hidden`}>
                <Modal.Header className="items-center justify-between border-b border-[#efe2d5] bg-[#fff8f1]/70 px-6 py-4">
                  <Modal.Heading>Редактирование рецепта</Modal.Heading>
                  <Modal.CloseTrigger />
                </Modal.Header>
                <Modal.Body className="bg-[#fffdfa]/56 px-6 py-5">
                  <Form
                    key={editingRecipe.id}
                    className="flex flex-col gap-5"
                    onSubmit={handleEditSubmit}
                  >
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
                      <div className="flex flex-col gap-4">
                        <TextField
                          aria-label="Название рецепта"
                          defaultValue={editingRecipe.name}
                          isRequired
                          name="name"
                          validate={validateRecipeName}
                        >
                          <Input
                            className={formFieldClassName}
                            maxLength={120}
                            placeholder="Название рецепта"
                          />
                          <FieldError />
                          <FieldServerError message={editState.errors.name?.[0]} />
                        </TextField>

                        <TextField
                          aria-label="Описание рецепта"
                          defaultValue={editingRecipe.description}
                          isRequired
                          name="description"
                          validate={validateRecipeDescription}
                        >
                          <TextArea
                            className={textAreaClassName}
                            maxLength={600}
                            placeholder="Описание рецепта"
                            rows={5}
                          />
                          <FieldError />
                          <FieldServerError message={editState.errors.description?.[0]} />
                        </TextField>

                        <input
                          name="currentImageUrl"
                          type="hidden"
                          value={editingRecipe.imageUrl}
                        />
                        <input
                          name="ingredientsPayload"
                          type="hidden"
                          value={JSON.stringify(editIngredientRows)}
                        />
                        <input
                          name="imageSource"
                          type="hidden"
                          value={editImageSource}
                        />

                        <RecipeIngredientFields
                          availableIngredients={availableIngredients}
                          errorMessage={editState.errors.ingredientsPayload?.[0]}
                          onAddRow={() =>
                            setEditIngredientRows((currentRows) => [
                              ...currentRows,
                              createEmptyRecipeIngredientDraft(),
                            ])
                          }
                          onIngredientChange={(index, ingredientId) =>
                            setEditIngredientRows((currentRows) =>
                              currentRows.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, ingredientId }
                                  : row,
                              ),
                            )
                          }
                          onQuantityChange={(index, quantity) =>
                            setEditIngredientRows((currentRows) =>
                              currentRows.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, quantity }
                                  : row,
                              ),
                            )
                          }
                          onRemoveRow={(index) =>
                            setEditIngredientRows((currentRows) =>
                              currentRows.length === 1
                                ? currentRows
                                : currentRows.filter(
                                    (_, rowIndex) => rowIndex !== index,
                                  ),
                            )
                          }
                          rows={editIngredientRows}
                        />

                        <div className="flex flex-wrap gap-2">
                          <Button
                            className={
                              editImageSource === 'url'
                                ? filledButtonClassName
                                : softButtonClassName
                            }
                            onPress={() => {
                              resetEditPreview();
                              setEditImageSource('url');
                              setEditPreviewUrl(editImageUrl || editingRecipe.imageUrl);
                            }}
                            type="button"
                            variant={editImageSource === 'url' ? 'primary' : 'secondary'}
                          >
                            Картинка по ссылке
                          </Button>
                          <Button
                            className={
                              editImageSource === 'file'
                                ? filledButtonClassName
                                : softButtonClassName
                            }
                            onPress={() => {
                              setEditImageSource('file');
                              setEditPreviewUrl(editPreviewUrl || editingRecipe.imageUrl);
                            }}
                            type="button"
                            variant={editImageSource === 'file' ? 'primary' : 'secondary'}
                          >
                            Картинка файлом
                          </Button>
                        </div>

                        {editImageSource === 'url' ? (
                          <TextField
                            aria-label="Ссылка на изображение рецепта"
                            defaultValue={editImageUrl}
                            isRequired
                            name="imageUrl"
                            validate={validateImageUrl}
                          >
                            <Input
                              className={formFieldClassName}
                              onChange={(event) => {
                                setEditImageUrl(event.target.value);
                                setEditPreviewUrl(
                                  event.target.value || editingRecipe.imageUrl,
                                );
                              }}
                              placeholder="https://example.com/recipe.jpg"
                              value={editImageUrl}
                            />
                            <FieldError />
                            <FieldServerError message={editState.errors.imageUrl?.[0]} />
                          </TextField>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <input
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              className={fileInputClassName}
                              name="imageFile"
                              onChange={(event) => {
                                const nextFile = event.target.files?.[0];

                                resetEditPreview();

                                if (!nextFile) {
                                  setEditPreviewUrl(editingRecipe.imageUrl);
                                  return;
                                }

                                const objectUrl = URL.createObjectURL(nextFile);

                                editFilePreviewObjectUrlRef.current = objectUrl;
                                setEditSelectedFileName(nextFile.name);
                                setEditPreviewUrl(objectUrl);
                              }}
                              type="file"
                            />
                            <p className="text-sm text-[#8b6742]">
                              {editSelectedFileName
                                ? `Выбран файл: ${editSelectedFileName}`
                                : 'Если новый файл не выбран, останется текущее изображение этого же типа.'}
                            </p>
                            <FieldServerError message={editState.errors.imageFile?.[0]} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b7855]">
                          Предпросмотр
                        </p>
                        <RecipeImagePreview
                          alt={`Изображение рецепта ${editingRecipe.name}`}
                          imageUrl={editPreviewUrl}
                        />
                      </div>
                    </div>

                    <FormStatusMessage
                      message={editState.message}
                      tone={editState.status === 'success' ? 'success' : 'error'}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        className={filledButtonClassName}
                        isDisabled={
                          (isPending && pendingRecipeId === editingRecipe.id)
                          || !availableIngredients.length
                        }
                        type="submit"
                      >
                        <SuccessIcon />
                        {isPending && pendingRecipeId === editingRecipe.id
                          ? 'Сохранение...'
                          : 'Сохранить'}
                      </Button>
                      <Button
                        className={softButtonClassName}
                        isDisabled={isPending && pendingRecipeId === editingRecipe.id}
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
