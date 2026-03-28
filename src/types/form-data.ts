export interface RegisterFormFields {
  email: string;
  password: string;
  confirmPassword: string;
}

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormFields, string[]>
>;

export interface RegisterFormState {
  status: 'idle' | 'success' | 'error';
  message: string;
  errors: RegisterFormErrors;
}

export const initialRegisterFormState: RegisterFormState = {
  status: 'idle',
  message: '',
  errors: {},
};

export type IformData = RegisterFormFields;
