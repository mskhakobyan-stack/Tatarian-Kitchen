interface FieldServerErrorProps {
  message?: string;
}

interface FormStatusMessageProps {
  message?: string;
  tone: 'error' | 'success';
}

/**
 * Показывает серверную ошибку для конкретного поля.
 *
 * Такой текст нужен отдельно от встроенного `FieldError`, потому что
 * `FieldError` отображает только клиентскую валидацию HeroUI, а сюда
 * приходят ответы с сервера после `useActionState`.
 */
export function FieldServerError({ message }: FieldServerErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-danger">{message}</p>;
}

/**
 * Единый вывод статуса формы после отправки.
 *
 * Компонент отвечает только за оформление и `aria-live`, чтобы обе формы
 * показывали сообщения об успехе и ошибке одинаково.
 */
export function FormStatusMessage({
  message,
  tone,
}: FormStatusMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={tone === 'success' ? 'text-sm text-success' : 'text-sm text-danger'}
    >
      {message}
    </p>
  );
}
