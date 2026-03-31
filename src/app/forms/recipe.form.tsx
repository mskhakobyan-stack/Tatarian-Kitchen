'use client';

import {
  useActionState,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  SuccessIcon,
  TextArea,
  TextField,
} from '@heroui/react';

import { createRecipe } from '@/actions/recipe';
import {
  FieldServerError,
  FormStatusMessage,
} from '@/components/UI/form-feedback';
import { RecipeImagePreview } from '@/components/UI/recipe-image-preview';
import { RecipeIngredientFields } from '@/components/UI/recipe-ingredient-fields';
import {
  fileInputClassName,
  filledButtonClassName,
  formFieldClassName,
  formSurfaceClassName,
  softButtonClassName,
  textAreaClassName,
} from '@/components/UI/ui-theme';
import type {
  RecipeImageSource,
  RecipeIngredientOption,
  SavedRecipe,
} from '@/types/recipe-form';
import {
  createEmptyRecipeIngredientDraft,
  initialRecipeFormState,
} from '@/types/recipe-form';

interface RecipeFormProps {
  availableIngredients: RecipeIngredientOption[];
  onRecipeCreated?: (recipe: SavedRecipe) => void;
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
 * Форма рецепта использует server action и локальный preview, чтобы пользователь
 * видел итоговую карточку ещё до отправки.
 */
export function RecipeForm({
  availableIngredients = [],
  onRecipeCreated,
}: RecipeFormProps) {
  const normalizedIngredients = availableIngredients ?? [];
  const [state, formAction, pending] = useActionState(
    createRecipe,
    initialRecipeFormState,
  );
  const [imageSource, setImageSource] = useState<RecipeImageSource>('url');
  const [imageUrlValue, setImageUrlValue] = useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [ingredientRows, setIngredientRows] = useState([
    createEmptyRecipeIngredientDraft(),
  ]);
  const lastReportedRecipeIdRef = useRef<string | null>(null);
  const filePreviewObjectUrlRef = useRef<string | null>(null);
  const deferredImageUrlValue = useDeferredValue(imageUrlValue);
  const previewUrl =
    imageSource === 'url' ? deferredImageUrlValue.trim() : filePreviewUrl;

  const resetFilePreview = () => {
    if (filePreviewObjectUrlRef.current) {
      URL.revokeObjectURL(filePreviewObjectUrlRef.current);
      filePreviewObjectUrlRef.current = null;
    }

    setFilePreviewUrl('');
    setSelectedFileName('');
  };

  const resetFormState = () => {
    setImageSource('url');
    setImageUrlValue('');
    resetFilePreview();
    setIngredientRows([createEmptyRecipeIngredientDraft()]);
  };

  const handleRecipeSaved = useEffectEvent((recipe: SavedRecipe) => {
    onRecipeCreated?.(recipe);
    resetFormState();
  });

  useEffect(() => {
    if (state.status !== 'success' || !state.recipe) {
      return;
    }

    if (lastReportedRecipeIdRef.current === state.recipe.id) {
      return;
    }

    lastReportedRecipeIdRef.current = state.recipe.id;
    handleRecipeSaved(state.recipe);
  }, [state.recipe, state.status]);

  useEffect(() => {
    return () => {
      if (filePreviewObjectUrlRef.current) {
        URL.revokeObjectURL(filePreviewObjectUrlRef.current);
      }
    };
  }, []);

  return (
    <div
      key={state.recipe?.id ?? 'recipe-form-container'}
      className="mt-4 flex w-full flex-col gap-4"
    >
      <Form
        action={formAction}
        key={state.recipe?.id ?? 'recipe-form'}
        className={`flex w-full flex-col gap-5 ${formSurfaceClassName} p-6`}
        onReset={resetFormState}
      >
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="flex flex-col gap-4">
            <TextField
              aria-label="Название рецепта"
              isRequired
              name="name"
              validate={validateRecipeName}
            >
              <Input
                className={formFieldClassName}
                maxLength={120}
                placeholder="Название рецепта, например эчпочмак"
              />
              <FieldError />
              <FieldServerError message={state.errors.name?.[0]} />
            </TextField>

            <TextField
              aria-label="Описание рецепта"
              isRequired
              name="description"
              validate={validateRecipeDescription}
            >
              <TextArea
                className={textAreaClassName}
                maxLength={600}
                placeholder="Коротко опишите блюдо, вкус, подачу или историю рецепта"
                rows={5}
              />
              <FieldError />
              <FieldServerError message={state.errors.description?.[0]} />
            </TextField>

            <input name="currentImageUrl" type="hidden" value="" />
            <input
              name="ingredientsPayload"
              type="hidden"
              value={JSON.stringify(ingredientRows)}
            />
            <input name="imageSource" type="hidden" value={imageSource} />

            <RecipeIngredientFields
              availableIngredients={normalizedIngredients}
              errorMessage={state.errors.ingredientsPayload?.[0]}
              onAddRow={() =>
                setIngredientRows((currentRows) => [
                  ...currentRows,
                  createEmptyRecipeIngredientDraft(),
                ])
              }
              onIngredientChange={(index, ingredientId) =>
                setIngredientRows((currentRows) =>
                  currentRows.map((row, rowIndex) =>
                    rowIndex === index
                      ? { ...row, ingredientId }
                      : row,
                  ),
                )
              }
              onQuantityChange={(index, quantity) =>
                setIngredientRows((currentRows) =>
                  currentRows.map((row, rowIndex) =>
                    rowIndex === index
                      ? { ...row, quantity }
                      : row,
                  ),
                )
              }
              onRemoveRow={(index) =>
                setIngredientRows((currentRows) =>
                  currentRows.length === 1
                    ? currentRows
                    : currentRows.filter((_, rowIndex) => rowIndex !== index),
                )
              }
              rows={ingredientRows}
            />

            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  className={
                    imageSource === 'url'
                      ? filledButtonClassName
                      : softButtonClassName
                  }
                  onPress={() => {
                    setImageSource('url');
                    resetFilePreview();
                  }}
                  type="button"
                  variant={imageSource === 'url' ? 'primary' : 'secondary'}
                >
                  Картинка по ссылке
                </Button>
                <Button
                  className={
                    imageSource === 'file'
                      ? filledButtonClassName
                      : softButtonClassName
                  }
                  onPress={() => {
                    setImageSource('file');
                    setImageUrlValue('');
                  }}
                  type="button"
                  variant={imageSource === 'file' ? 'primary' : 'secondary'}
                >
                  Картинка файлом
                </Button>
              </div>

              {imageSource === 'url' ? (
                <TextField
                  aria-label="Ссылка на изображение рецепта"
                  isRequired
                  name="imageUrl"
                  validate={validateImageUrl}
                >
                  <Input
                    className={formFieldClassName}
                    onChange={(event) => setImageUrlValue(event.target.value)}
                    placeholder="https://example.com/recipe.jpg"
                    value={imageUrlValue}
                  />
                  <Description>Поддерживаются внешние изображения по HTTPS.</Description>
                  <FieldError />
                  <FieldServerError message={state.errors.imageUrl?.[0]} />
                </TextField>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className={fileInputClassName}
                    name="imageFile"
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0];

                      resetFilePreview();

                      if (!nextFile) {
                        return;
                      }

                      const objectUrl = URL.createObjectURL(nextFile);

                      filePreviewObjectUrlRef.current = objectUrl;
                      setFilePreviewUrl(objectUrl);
                      setSelectedFileName(nextFile.name);
                    }}
                    type="file"
                  />
                  <Description>
                    {selectedFileName
                      ? `Выбран файл: ${selectedFileName}`
                      : 'Загрузите JPG, PNG, WEBP или GIF размером до 5 МБ.'}
                  </Description>
                  <FieldServerError message={state.errors.imageFile?.[0]} />
                </div>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b7855]">
              Предпросмотр карточки
            </p>
            <RecipeImagePreview
              alt="Предпросмотр изображения рецепта"
              imageUrl={previewUrl}
            />
          </div>
        </div>

        <FormStatusMessage
          message={state.message}
          tone={state.status === 'success' ? 'success' : 'error'}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            className={filledButtonClassName}
            isDisabled={pending || !normalizedIngredients.length}
            type="submit"
          >
            <SuccessIcon />
            {pending ? 'Сохранение...' : 'Добавить рецепт'}
          </Button>
          <Button
            className={softButtonClassName}
            isDisabled={pending}
            type="reset"
            variant="secondary"
          >
            Сбросить
          </Button>
        </div>
      </Form>
    </div>
  );
}
