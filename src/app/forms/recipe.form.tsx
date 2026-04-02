'use client';

import {
  useActionState,
  useDeferredValue,
  useEffect,
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
import { useReportedFormSuccess } from '@/app/forms/use-reported-form-success';
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
import {
  validateRecipeDescription,
  validateRecipeImageUrl,
  validateRecipeName,
} from '@/lib/recipe-form';
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

/**
 * Форма рецепта использует server action и локальный preview, чтобы пользователь
 * видел итоговую карточку ещё до отправки.
 */
export function RecipeForm({
  availableIngredients = [],
  onRecipeCreated,
}: RecipeFormProps) {
  /**
   * Основной state формы делим по зонам ответственности:
   * server action state, источник картинки, локальный preview и черновик ингредиентов.
   */
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
  const filePreviewObjectUrlRef = useRef<string | null>(null);
  const deferredImageUrlValue = useDeferredValue(imageUrlValue);
  const previewUrl =
    imageSource === 'url' ? deferredImageUrlValue.trim() : filePreviewUrl;

  /**
   * Локальные object URL нужно корректно чистить, иначе браузер удерживает
   * память даже после переключения файла или размонтирования формы.
   */
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

  const handleRecipeSaved = (recipe: SavedRecipe) => {
    onRecipeCreated?.(recipe);
    resetFormState();
  };

  /**
   * После успешного ответа сообщаем родителю о новом рецепте только один раз,
   * даже если React повторно проигрывает эффекты в dev-режиме.
   */
  useReportedFormSuccess(state.status, state.recipe, handleRecipeSaved);

  /**
   * Финальная зачистка object URL нужна на случай ухода со страницы
   * или пересборки клиентского дерева.
   */
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
        {/* Левая колонка отвечает за ввод данных, правая показывает живой preview карточки. */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
          <div className="flex flex-col gap-4">
            {/* Базовые текстовые поля рецепта. */}
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

            {/* Служебные hidden-поля передают в action текущий режим картинки и состав рецепта. */}
            <input name="currentImageUrl" type="hidden" value="" />
            <input
              name="ingredientsPayload"
              type="hidden"
              value={JSON.stringify(ingredientRows)}
            />
            <input name="imageSource" type="hidden" value={imageSource} />

            {/* Отдельный блок состава хранит строки ингредиентов в клиентском draft-state. */}
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

            {/* Блок изображения позволяет переключаться между внешней ссылкой и локальным файлом. */}
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
                  validate={validateRecipeImageUrl}
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

          {/* Правая колонка нужна только для визуальной обратной связи до отправки формы. */}
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

        {/* Нижняя зона собирает глобальный ответ формы и основные управляющие кнопки. */}
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
