'use client';

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
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};

    // Convert FormData to plain object
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    alert(
      `Форма "Вход" отправлена с данными: ${JSON.stringify(data, null, 2)}`,
    );
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
        minLength={8}
        name="password"
        type="password"
        validate={(value) => {
          if (value.length < 8) {
            return 'Пароль должен содержать не менее 8 символов';
          }
          if (!/[A-Z]/.test(value)) {
            return 'Пароль должен содержать хотя бы одну заглавную букву';
          }
          if (!/[0-9]/.test(value)) {
            return 'Пароль должен содержать хотя бы одну цифру';
          }

          return null;
        }}
      >
        <Label>Пароль</Label>
        <Input placeholder="Введите пароль" />
        <Description>
          Не менее 8 символов, 1 заглавная буква и 1 цифра
        </Description>
        <FieldError />
      </TextField>

      <div className="flex gap-2">
        <Button type="submit">
          <SuccessIcon />
          Вход
        </Button>
        <Button type="reset" variant="secondary">
          Сбросить
        </Button>
      </div>
    </Form>
  );
}
