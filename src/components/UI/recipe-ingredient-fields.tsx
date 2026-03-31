'use client';

import {
  Button,
  Description,
  Input,
  ListBox,
  Select,
  TextField,
} from '@heroui/react';

import { FieldServerError } from '@/components/UI/form-feedback';
import {
  formFieldClassName,
  selectTriggerClassName,
  softButtonClassName,
} from '@/components/UI/ui-theme';
import { getUnitLabel } from '@/lib/ingredient-units';
import type {
  RecipeIngredientDraft,
  RecipeIngredientOption,
} from '@/types/recipe-form';

interface RecipeIngredientFieldsProps {
  availableIngredients: RecipeIngredientOption[];
  errorMessage?: string;
  onAddRow: () => void;
  onIngredientChange: (index: number, ingredientId: string) => void;
  onQuantityChange: (index: number, quantity: string) => void;
  onRemoveRow: (index: number) => void;
  rows: RecipeIngredientDraft[];
}

export function RecipeIngredientFields({
  availableIngredients = [],
  errorMessage,
  onAddRow,
  onIngredientChange,
  onQuantityChange,
  onRemoveRow,
  rows,
}: RecipeIngredientFieldsProps) {
  const normalizedIngredients = availableIngredients ?? [];

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#9b7855]">
            Состав рецепта
          </p>
          <p className="text-sm leading-6 text-[#8b6742]">
            Выберите ингредиенты из уже добавленных и укажите количество.
          </p>
        </div>
        <Button
          className={softButtonClassName}
          isDisabled={!normalizedIngredients.length}
          onPress={onAddRow}
          type="button"
          variant="secondary"
        >
          Добавить ингредиент
        </Button>
      </div>

      {normalizedIngredients.length ? (
        <div className="flex flex-col gap-3">
          {rows.map((row, index) => {
            const selectedIngredient = normalizedIngredients.find(
              (ingredient) => ingredient.id === row.ingredientId,
            );

            return (
              <div
                key={`${index}-${row.ingredientId || 'empty'}`}
                className="grid gap-3 rounded-[24px] border border-[#ecdcca] bg-[#fffdf9]/52 p-4 md:grid-cols-[minmax(0,1fr)_220px_auto]"
              >
                <Select
                  aria-label={`Ингредиент для строки ${index + 1}`}
                  placeholder="Выберите ингредиент"
                  selectedKey={row.ingredientId || null}
                  onSelectionChange={(selectedKey) =>
                    onIngredientChange(
                      index,
                      selectedKey ? String(selectedKey) : '',
                    )
                  }
                >
                  <Select.Trigger className={selectTriggerClassName}>
                    <Select.Value />
                    <Select.Indicator className="shrink-0 text-[#9a744a]" />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {normalizedIngredients.map((ingredient) => (
                        <ListBox.Item
                          id={ingredient.id}
                          key={ingredient.id}
                          textValue={ingredient.name}
                        >
                          {ingredient.name}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <TextField
                  aria-label={`Количество ингредиента для строки ${index + 1}`}
                >
                  <Input
                    className={formFieldClassName}
                    inputMode="decimal"
                    onChange={(event) =>
                      onQuantityChange(index, event.target.value)
                    }
                    placeholder={
                      selectedIngredient
                        ? `Количество, ${getUnitLabel(selectedIngredient.unit)}`
                        : 'Количество'
                    }
                    value={row.quantity}
                  />
                  <Description>
                    {selectedIngredient
                      ? `Единица измерения: ${getUnitLabel(selectedIngredient.unit)}`
                      : 'Ингредиент выбирается из уже заполненной базы.'}
                  </Description>
                </TextField>

                <Button
                  className={softButtonClassName}
                  isDisabled={rows.length === 1}
                  onPress={() => onRemoveRow(index)}
                  type="button"
                  variant="secondary"
                >
                  Убрать
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#e5d1ba] bg-[#fffdfa]/48 px-5 py-4 text-sm leading-6 text-[#8b6742]">
          Сначала добавьте ингредиенты на странице ингредиентов, затем они
          появятся в составе рецепта.
        </div>
      )}

      <FieldServerError message={errorMessage} />
    </section>
  );
}
