interface PasswordVisibilityToggleProps {
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * Небольшая кнопка-переключатель для показа и скрытия пароля.
 *
 * Вынесена в общий компонент, чтобы логика и подписи были одинаковыми
 * и в форме входа, и в форме регистрации.
 */
export function PasswordVisibilityToggle({
  isVisible,
  onToggle,
}: PasswordVisibilityToggleProps) {
  return (
    <button
      aria-pressed={isVisible}
      className="self-end text-sm font-medium text-[#8b4418] transition-colors hover:text-[#743714]"
      onClick={onToggle}
      type="button"
    >
      {isVisible ? 'Скрыть пароль' : 'Показать пароль'}
    </button>
  );
}
