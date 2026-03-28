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
        validate={(value) => {
          if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
            return 'Введите корректный адрес электронной почты';
          }

          return null;
        }}
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
        validate={(value) => {
          if (value.length < 6) {
            return 'Пароль должен содержать не менее 6 символов';
          }
          if (!/[A-Z]/.test(value)) {
            return 'Пароль должен содержать хотя бы одну заглавную букву';
          }

          return null;
        }}
      >
        <Label>Пароль</Label>
        <Input placeholder="Введите пароль" ref={passwordRef} />
        <Description>Не менее 6 символов и 1 заглавная буква</Description>
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
        <Input placeholder="Повторите пароль" />
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
