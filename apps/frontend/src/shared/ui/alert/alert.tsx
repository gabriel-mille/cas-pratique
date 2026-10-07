import type { ReactNode } from 'react';
import styles from './alert.module.css';

export interface AlertProps {
  children: ReactNode;
  /** `error` est annoncé immédiatement (`role="alert"`), les autres poliment (`role="status"`, WCAG 4.1.3). */
  tone?: 'error' | 'info' | 'success';
}

/** Message dans la page : une erreur critique ne repose jamais sur un toast seul. */
export function Alert({ children, tone = 'error' }: AlertProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`${styles.alert} ${styles[tone]}`}>
      {children}
    </div>
  );
}
