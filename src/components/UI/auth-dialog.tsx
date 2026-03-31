import type { ReactNode } from 'react';
import { Button, Modal } from '@heroui/react';

import { formSurfaceClassName } from '@/components/UI/ui-theme';

interface AuthDialogProps {
  buttonClassName: string;
  buttonLabel: string;
  buttonVariant: 'primary' | 'secondary';
  children: ReactNode;
  heading: string;
}

/**
 * Общая оболочка для модальных окон авторизации.
 *
 * Компонент избавляет хедер от дублирования одинаковой HeroUI-разметки:
 * снаружи мы настраиваем только подпись кнопки, заголовок и внутреннюю форму.
 */
export function AuthDialog({
  buttonClassName,
  buttonLabel,
  buttonVariant,
  children,
  heading,
}: AuthDialogProps) {
  return (
    <Modal>
      <Modal.Trigger>
        <Button className={buttonClassName} variant={buttonVariant}>
          {buttonLabel}
        </Button>
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container placement="center" size="md">
          <Modal.Dialog className={`${formSurfaceClassName} overflow-hidden`}>
            <Modal.Header className="items-center justify-between border-b border-[#efe2d5] bg-[#fff8f1]/70 px-6 py-4">
              <Modal.Heading>{heading}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Body className="bg-[#fffdfa]/56 px-6 py-5">
              {children}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
