import * as RadixToast from '@radix-ui/react-toast';
import { createContext, type ReactNode, useCallback, useContext, useRef, useState } from 'react';
import styles from './toast.module.css';

type Notify = (message: string) => void;

const ToastContext = createContext<Notify>(() => undefined);

/** Confirmations éphémères (Radix Toast). Les erreurs critiques restent affichées dans la page. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const nextId = useRef(0);
  const notify = useCallback<Notify>((message) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current, { id, message }]);
  }, []);
  const dismiss = (id: number) => setToasts((current) => current.filter((toast) => toast.id !== id));

  return (
    <RadixToast.Provider label="Notification" duration={6000}>
      <ToastContext.Provider value={notify}>{children}</ToastContext.Provider>
      {toasts.map((toast) => (
        <RadixToast.Root key={toast.id} className={styles.toast} onOpenChange={(open) => open || dismiss(toast.id)}>
          <RadixToast.Description>{toast.message}</RadixToast.Description>
          <RadixToast.Close className={styles.close} aria-label="Fermer la notification">
            ×
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className={styles.viewport} />
    </RadixToast.Provider>
  );
}

export const useToast = (): Notify => useContext(ToastContext);
