'use client';

import { useActionState, useRef } from 'react';
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
import { initialRegisterFormState } from '@/types/form-data';

export function RegistartionForm() {
  const passwordRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(
    registerUser,
    initialRegisterFormState,
  );

  return (
    <Form action={formAction} className="flex w-96 flex-col gap-4">
      <TextField
        isRequired
        name="email"
        type="email"
        validate={validateEmailValue}
      >
        <Label>Электронная почта</Label>
        <Input placeholder="john@example.com" />
        <FieldError />
        {state.errors.email?.[0] ? (
          <p className="text-sm text-danger">{state.errors.email[0]}</p>
        ) : null}
      </TextField>

      <TextField
        isRequired
        minLength={6}
        name="password"
        type="password"
        validate={validatePasswordValue}
      >
        <Label>Пароль</Label>
        <Input
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder="Введите пароль"
          ref={passwordRef}
        />
        <Description>
          От 6 до 32 символов и не менее 1 заглавной буквы
        </Description>
        <FieldError />
        {state.errors.password?.[0] ? (
          <p className="text-sm text-danger">{state.errors.password[0]}</p>
        ) : null}
      </TextField>

      <TextField
        isRequired
        name="confirmPassword"
        type="password"
        validate={(value) => {
          if (value !== passwordRef.current?.value) {
            return 'Пароли должны совпадать';
          }

          return null;
        }}
      >
        <Label>Подтвердите пароль</Label>
        <Input
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder="Повторите пароль"
        />
        <Description>Повторно введите пароль для проверки</Description>
        <FieldError />
        {state.errors.confirmPassword?.[0] ? (
          <p className="text-sm text-danger">
            {state.errors.confirmPassword[0]}
          </p>
        ) : null}
      </TextField>

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === 'success'
              ? 'text-sm text-success'
              : 'text-sm text-danger'
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button isDisabled={pending} type="submit">
          <SuccessIcon />
          {pending ? 'Отправка...' : 'Отправить'}
        </Button>
        <Button isDisabled={pending} type="reset" variant="secondary">
          Сбросить
        </Button>
      </div>
    </Form>
  );
}
