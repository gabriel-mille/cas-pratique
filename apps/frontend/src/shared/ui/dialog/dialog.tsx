import type { ReactNode } from 'react';
import { Dialog as AriaDialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import styles from './dialog.module.css';

export interface DialogProps {
  title: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children: ReactNode;
}

/** Modale React Aria : focus piégé puis rendu, fermeture par Échap, titre lié (WAI-ARIA APG « Dialog (Modal) »). */
export function Dialog({ title, isOpen, onOpenChange, children }: DialogProps) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className={styles.overlay}>
      <Modal className={styles.modal}>
        <AriaDialog className={styles.dialog}>
          <Heading slot="title" className={styles.title}>
            {title}
          </Heading>
          {children}
        </AriaDialog>
      </Modal>
    </ModalOverlay>
  );
}
