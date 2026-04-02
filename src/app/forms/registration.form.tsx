'use client';

import {
  useActionState,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  validatePasswordValue,
} from '@/auth/auth-validation';
import {
  finishAuthNavigation,
  getAuthCredentialsFromForm,
  signInWithCredentials,
  syncAuthenticatedSession,
  type AuthCredentials,
} from '@/app/forms/auth-client';
import { registerUser } from '@/actions/register';
import { useAuthStore } from '@/auth/auth-store';
import {
  FieldServerError,
  FormStatusMessage,
} from '@/components/UI/form-feedback';
import { PasswordVisibilityToggle } from '@/components/UI/password-visibility-toggle';
import {
  authFormClassName,
  filledButtonClassName,
  formFieldClassName,
  softButtonClassName,
} from '@/components/UI/ui-theme';
import { getSafeCallbackUrl } from '@/lib/auth-redirect';
import { initialRegisterFormState } from '@/types/form-data';

const REGISTRATION_SIGN_IN_ERROR_MESSAGE =
  'Пользователь зарегистрирован, но автоматически войти не удалось. Попробуйте войти вручную.';
const REGISTRATION_SIGN_IN_PENDING_MESSAGE =
  'Регистрация прошла успешно. Выполняем вход...';
const REGISTRATION_SIGN_IN_SUCCESS_MESSAGE =
  'Регистрация завершена, вход выполнен.';

interface SubmittedRegistrationCredentials {
  attemptId: number;
  credentials: AuthCredentials;
}

function getRegistrationCredentialsFromForm(
  formElement: HTMLFormElement,
): SubmittedRegistrationCredentials | null {
  const credentials = getAuthCredentialsFromForm(formElement);

  if (!credentials) {
    return null;
  }

  return {
    attemptId: Date.now(),
    credentials,
  };
}

/**
 * Сверяем подтверждение пароля с текущим значением первого поля пароля.
 */
function validatePasswordConfirmation(
  value: string,
  password: string | undefined,
): string | null {
  if (value !== password) {
    return 'Пароли должны совпадать';
  }

  return null;
}

/**
 * Форма регистрации использует `useActionState`, поэтому серверная валидация,
 * ошибки БД и успешный ответ сразу возвращаются в React-состояние.
 */
export function RegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const submittedCredentialsRef =
    useRef<SubmittedRegistrationCredentials | null>(null);
  const lastAutoSignInAttemptIdRef = useRef<number | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [isSigningIn, startSignInTransition] = useTransition();
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialRegisterFormState,
  );
  const clearAuth = useAuthStore((store) => store.clearAuth);
  const syncSession = useAuthStore((store) => store.syncSession);
  const safeCallbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'));

  const handleAutoSignIn = useEffectEvent(
    (credentials: SubmittedRegistrationCredentials) => {
      startSignInTransition(async () => {
        setAuthMessage(REGISTRATION_SIGN_IN_PENDING_MESSAGE);

        try {
          const isSignedIn = await signInWithCredentials(credentials.credentials);

          if (!isSignedIn) {
            clearAuth();
            setAuthMessage(REGISTRATION_SIGN_IN_ERROR_MESSAGE);
            return;
          }

          const session = await syncAuthenticatedSession({
            clearAuth,
            syncSession,
          });

          if (!session) {
            setAuthMessage(REGISTRATION_SIGN_IN_ERROR_MESSAGE);
            return;
          }

          setAuthMessage(REGISTRATION_SIGN_IN_SUCCESS_MESSAGE);
          finishAuthNavigation(router, safeCallbackUrl);
        } catch (error) {
          console.error('Failed to sign in after registration', error);
          clearAuth();
          setAuthMessage(REGISTRATION_SIGN_IN_ERROR_MESSAGE);
        }
      });
    },
  );

  useEffect(() => {
    if (state.status !== 'success') {
      return;
    }

    const submittedCredentials = submittedCredentialsRef.current;

    if (!submittedCredentials) {
      return;
    }

    if (lastAutoSignInAttemptIdRef.current === submittedCredentials.attemptId) {
      return;
    }

    lastAutoSignInAttemptIdRef.current = submittedCredentials.attemptId;
    handleAutoSignIn(submittedCredentials);
  }, [state.status]);

  return (
    <Form
      action={formAction}
      className={authFormClassName}
      onSubmit={(event) => {
        submittedCredentialsRef.current = getRegistrationCredentialsFromForm(
          event.currentTarget,
        );
        setAuthMessage('');
      }}
      onReset={() => {
        setIsPasswordVisible(false);
        setIsConfirmPasswordVisible(false);
        setAuthMessage('');
      }}
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
        <FieldServerError message={state.errors.email?.[0]} />
      </TextField>

      <TextField
        isRequired
        minLength={6}
        name="password"
        type={isPasswordVisible ? 'text' : 'password'}
        validate={validatePasswordValue}
      >
        <Label>Пароль</Label>
        <Input
          className={formFieldClassName}
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder="Введите пароль"
          ref={passwordInputRef}
        />
        <PasswordVisibilityToggle
          isVisible={isPasswordVisible}
          onToggle={() => setIsPasswordVisible((current) => !current)}
        />
        <Description>
          От 6 до 32 символов и не менее 1 заглавной буквы
        </Description>
        <FieldError />
        <FieldServerError message={state.errors.password?.[0]} />
      </TextField>

      <TextField
        isRequired
        name="confirmPassword"
        type={isConfirmPasswordVisible ? 'text' : 'password'}
        validate={(value) =>
          validatePasswordConfirmation(value, passwordInputRef.current?.value)
        }
      >
        <Label>Подтвердите пароль</Label>
        <Input
          className={formFieldClassName}
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder="Повторите пароль"
        />
        <PasswordVisibilityToggle
          isVisible={isConfirmPasswordVisible}
          onToggle={() =>
            setIsConfirmPasswordVisible((current) => !current)
          }
        />
        <Description>Повторно введите пароль для проверки</Description>
        <FieldError />
        <FieldServerError message={state.errors.confirmPassword?.[0]} />
      </TextField>

      <FormStatusMessage
        message={authMessage || state.message}
        tone={
          authMessage && authMessage === REGISTRATION_SIGN_IN_ERROR_MESSAGE
            ? 'error'
            : state.status === 'success'
              ? 'success'
              : 'error'
        }
      />

      <div className="flex gap-2">
        <Button
          className={filledButtonClassName}
          isDisabled={pending || isSigningIn}
          type="submit"
        >
          <SuccessIcon />
          {pending || isSigningIn ? 'Отправка...' : 'Отправить'}
        </Button>
        <Button
          className={softButtonClassName}
          isDisabled={pending || isSigningIn}
          type="reset"
          variant="secondary"
        >
          Сбросить
        </Button>
      </div>
    </Form>
  );
}
