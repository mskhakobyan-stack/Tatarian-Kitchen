'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession, signIn } from 'next-auth/react';
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  SuccessIcon,
  TextField,
} from '@heroui/react';

import {
  PASSWORD_MAX_LENGTH,
  validateEmailValue,
  validatePasswordLengthValue,
} from '@/auth/auth-validation';
import { useAuthStore } from '@/auth/auth-store';
import { FormStatusMessage } from '@/components/UI/form-feedback';
import { PasswordVisibilityToggle } from '@/components/UI/password-visibility-toggle';
import {
  authFormClassName,
  filledButtonClassName,
  formFieldClassName,
  softButtonClassName,
} from '@/components/UI/ui-theme';

const LOGIN_ERROR_MESSAGE = 'Не удалось выполнить вход. Попробуйте ещё раз.';
const LOGIN_SUCCESS_MESSAGE = 'Вход выполнен успешно.';

/**
 * Достаём email и пароль из формы в одном месте, чтобы код обработчика
 * отправки оставался компактным и читался сверху вниз.
 */
function getCredentialsFromForm(formElement: HTMLFormElement) {
  const formData = new FormData(formElement);
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || typeof password !== 'string') {
    return null;
  }

  return { email, password };
}

/**
 * Форма входа работает целиком на клиенте:
 * она валидирует поля, вызывает `signIn`, а затем синхронизирует local store.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const clearAuth = useAuthStore((store) => store.clearAuth);
  const syncSession = useAuthStore((store) => store.syncSession);
  const callbackUrl = searchParams.get('callbackUrl');
  const safeCallbackUrl =
    callbackUrl &&
    callbackUrl.startsWith('/') &&
    !callbackUrl.startsWith('//')
      ? callbackUrl
      : null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const credentials = getCredentialsFromForm(event.currentTarget);

    if (!credentials) {
      setMessage('Не удалось прочитать данные формы.');
      return;
    }

    startTransition(async () => {
      setMessage('');
      try {
        const result = await signIn('credentials', {
          email: credentials.email,
          password: credentials.password,
          redirect: false,
        });

        if (!result || result.error) {
          clearAuth();
          setMessage('Неверная почта или пароль.');
          return;
        }

        const session = await getSession();

        if (!session?.user) {
          clearAuth();
          setMessage(LOGIN_ERROR_MESSAGE);
          return;
        }

        // Обновляем локальный store сразу, чтобы хедер и приветствие отреагировали без задержки.
        syncSession(session);
        setMessage(LOGIN_SUCCESS_MESSAGE);

        if (safeCallbackUrl) {
          router.replace(safeCallbackUrl);
          return;
        }

        router.refresh();
      } catch (error) {
        console.error('Failed to sign in', error);
        clearAuth();
        setMessage(LOGIN_ERROR_MESSAGE);
      }
    });
  };

  return (
    <Form
      className={authFormClassName}
      onReset={() => {
        setMessage('');
        setIsPasswordVisible(false);
      }}
      onSubmit={handleSubmit}
    >
      <TextField
        isRequired
        name="email"
        type="email"
        validate={validateEmailValue}
      >
        <Label>Электронная почта</Label>
        <Input
          className={formFieldClassName}
          placeholder="john@example.com"
        />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        minLength={6}
        name="password"
        type={isPasswordVisible ? 'text' : 'password'}
        validate={validatePasswordLengthValue}
      >
        <Label>Пароль</Label>
        <Input
          className={formFieldClassName}
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder="Введите пароль"
        />
        <PasswordVisibilityToggle
          isVisible={isPasswordVisible}
          onToggle={() => setIsPasswordVisible((current) => !current)}
        />
        <Description>От 6 до 32 символов</Description>
        <FieldError />
      </TextField>

      <FormStatusMessage
        message={message}
        tone={message === LOGIN_SUCCESS_MESSAGE ? 'success' : 'error'}
      />

      <div className="flex gap-2">
        <Button
          className={filledButtonClassName}
          isDisabled={isPending}
          type="submit"
        >
          <SuccessIcon />
          {isPending ? 'Вход...' : 'Вход'}
        </Button>
        <Button
          className={softButtonClassName}
          isDisabled={isPending}
          type="reset"
          variant="secondary"
        >
          Сбросить
        </Button>
      </div>
    </Form>
  );
}
