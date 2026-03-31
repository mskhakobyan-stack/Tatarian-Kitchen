'use client';

import { useActionState, useRef, useState } from 'react';
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
import { registerUser } from '@/actions/register';
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
import { initialRegisterFormState } from '@/types/form-data';

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
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialRegisterFormState,
  );

  return (
    <Form
      action={formAction}
      className={authFormClassName}
      onReset={() => {
        setIsPasswordVisible(false);
        setIsConfirmPasswordVisible(false);
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
        message={state.message}
        tone={state.status === 'success' ? 'success' : 'error'}
      />

      <div className="flex gap-2">
        <Button
          className={filledButtonClassName}
          isDisabled={pending}
          type="submit"
        >
          <SuccessIcon />
          {pending ? 'Отправка...' : 'Отправить'}
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
  );
}
