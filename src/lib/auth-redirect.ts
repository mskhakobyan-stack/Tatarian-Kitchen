export type CallbackUrlValue = string | string[] | null | undefined;

/**
 * Разрешаем только внутренние callback URL, чтобы auth-flow не уводил
 * пользователя на внешний адрес после входа или регистрации.
 */
export function getSafeCallbackUrl(
  callbackUrl: CallbackUrlValue,
): string | null {
  if (typeof callbackUrl !== 'string') {
    return null;
  }

  return callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')
    ? callbackUrl
    : null;
}
