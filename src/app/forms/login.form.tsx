'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
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

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    if (typeof email !== 'string' || typeof password !== 'string') {
      setMessage('Не удалось прочитать данные формы.');
      return;
    }

    startTransition(async () => {
      setMessage('');

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setMessage('Неверная почта или пароль.');
        return;
      }

      setMessage('Вход выполнен успешно.');
      router.refresh();
    });
  };

  return (
    <Form className="flex w-96 flex-col gap-4" onSubmit={onSubmit}>
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
        <Input placeholder="Введите пароль" />
        <Description>Не менее 6 символов и 1 заглавная буква</Description>
        <FieldError />
      </TextField>

      {message ? (
        <p
          aria-live="polite"
          className={
            message === 'Вход выполнен успешно.'
              ? 'text-sm text-success'
              : 'text-sm text-danger'
          }
        >
          {message}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button isDisabled={isPending} type="submit">
          <SuccessIcon />
          {isPending ? 'Вход...' : 'Вход'}
        </Button>
        <Button isDisabled={isPending} type="reset" variant="secondary">
          Сбросить
        </Button>
      </div>
    </Form>
  );
}
