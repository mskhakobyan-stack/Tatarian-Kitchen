export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 32;
export const PASSWORD_UPPERCASE_REGEX = /[A-Z]/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmailValue(value: string): string | null {
  if (!EMAIL_REGEX.test(value)) {
    return 'Введите корректный адрес электронной почты';
  }

  return null;
}

export function validatePasswordValue(value: string): string | null {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Пароль должен содержать не менее ${PASSWORD_MIN_LENGTH} символов`;
  }

  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Пароль должен содержать не более ${PASSWORD_MAX_LENGTH} символов`;
  }

  if (!PASSWORD_UPPERCASE_REGEX.test(value)) {
    return 'Пароль должен содержать хотя бы одну заглавную букву';
  }

  return null;
}
