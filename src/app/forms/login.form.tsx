'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  validatePasswordValue,
} from '@/auth/auth-validation';
import { useAuthStore } from '@/auth/auth-store';

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const clearAuth = useAuthStore((store) => store.clearAuth);
  const setStatus = useAuthStore((store) => store.setStatus);
  const syncSession = useAuthStore((store) => store.syncSession);

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
      setStatus('loading');

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        clearAuth();
        setMessage('Неверная почта или пароль.');
        return;
      }

      const session = await getSession();

      syncSession(session);
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
        validate={validateEmailValue}
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
        validate={validatePasswordValue}
      >
        <Label>Пароль</Label>
        <Input
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder="Введите пароль"
        />
        <Description>
          От 6 до 32 символов и не менее 1 заглавной буквы
        </Description>
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
