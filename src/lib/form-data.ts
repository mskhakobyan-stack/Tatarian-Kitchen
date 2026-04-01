import 'server-only';

/**
 * Конфиг описывает, какие строковые поля нужно прочитать из `FormData`
 * и требуется ли дополнительно обрезать пробелы по краям.
 */
export interface StringFormFieldConfig<FieldName extends string> {
  key: FieldName;
  trim?: boolean;
}

/**
 * Безопасно читаем одно поле из `FormData`, чтобы в валидацию не попали
 * `File`, `null` и другие неожиданные значения браузерной формы.
 */
export function getStringFormValue(
  formData: FormData,
  key: string,
  options: { trim?: boolean } = {},
): string {
  const value = formData.get(key);

  if (typeof value !== 'string') {
    return '';
  }

  return options.trim === false ? value : value.trim();
}

/**
 * Собираем набор строковых полей одним проходом, чтобы server action
 * описывал структуру формы декларативно, а не вручную для каждого поля.
 */
export function pickStringFormValues<FieldName extends string>(
  formData: FormData,
  fields: readonly StringFormFieldConfig<FieldName>[],
): Record<FieldName, string> {
  return fields.reduce<Record<FieldName, string>>((values, field) => {
    values[field.key] = getStringFormValue(formData, field.key, {
      trim: field.trim,
    });

    return values;
  }, {} as Record<FieldName, string>);
}

/**
 * Файлы читаем отдельно, потому что браузер может прислать либо `File`,
 * либо строку, либо пустое значение.
 */
export function getFileFormValue(formData: FormData, key: string): File | null {
  const value = formData.get(key);

  if (!value || typeof value === 'string') {
    return null;
  }

  return typeof value.arrayBuffer === 'function' ? value : null;
}

/**
 * Для update-сценариев удобно иметь отдельный helper, который одинаково
 * подчищает поля вне зависимости от того, пришли они из `FormData` или из props.
 */
export function normalizeStringFields<T extends object>(
  fields: { [Key in keyof T]: string },
): { [Key in keyof T]: string } {
  const normalizedFields = {} as { [Key in keyof T]: string };

  for (const key in fields) {
    const typedKey = key as keyof T;

    normalizedFields[typedKey] = fields[typedKey].trim();
  }

  return normalizedFields;
}
