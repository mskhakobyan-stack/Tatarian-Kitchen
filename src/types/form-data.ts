/**
 * Поля формы регистрации храним в одном интерфейсе, чтобы и action,
 * и клиентская форма говорили на одном языке.
 */
export interface RegisterFormFields {
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFieldName = keyof RegisterFormFields;

/**
 * Ошибки приходят не для каждого поля сразу, поэтому используем `Partial`.
 */
export type RegisterFormErrors = Partial<
  Record<RegisterFieldName, string[]>
>;

/**
 * Состояние формы предназначено для `useActionState`: здесь лежит и общий
 * статус отправки, и человекочитаемое сообщение, и набор полевых ошибок.
 */
export interface RegisterFormState {
  status: 'idle' | 'success' | 'error';
  message: string;
  errors: RegisterFormErrors;
}

/**
 * Начальное состояние возвращаем как константу, чтобы форма могла переиспользовать
 * его и на первом рендере, и при будущем сбросе.
 */
export const initialRegisterFormState: RegisterFormState = {
  status: 'idle',
  message: '',
  errors: {},
};
