/**
 * Общие правила валидации авторизации и регистрации.
 *
 * Мы держим их отдельно от UI, чтобы и формы, и серверные схемы
 * опирались на одни и те же ограничения.
 */
export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 32;
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;

/**
 * Нормализуем email до каноничного вида перед сохранением и поиском.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Клиентская валидация допускает лишние пробелы по краям и проверяет уже очищенное значение.
 */
export function validateEmailValue(value: string): string | null {
  if (!EMAIL_REGEX.test(value.trim())) {
    return 'Введите корректный адрес электронной почты';
  }

  return null;
}

/**
 * Для пароля проверяем длину и наличие хотя бы одной заглавной буквы.
 */
export function validatePasswordLengthValue(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Пароль должен содержать не менее ${PASSWORD_MIN_LENGTH} символов`;
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Пароль должен содержать не более ${PASSWORD_MAX_LENGTH} символов`;
  }

  return null;
}

/**
 * Полная проверка для регистрации поверх базовой длины требует заглавную букву.
 */
export function validatePasswordValue(value: string): string | null {
  const lengthError = validatePasswordLengthValue(value);

  if (lengthError) {
    return lengthError;
  }

  if (!PASSWORD_UPPERCASE_REGEX.test(value)) {
    return 'Пароль должен содержать хотя бы одну заглавную букву';
  }

  return null;
}
