import type { ReactNode } from 'react';
import styles from './page-header.module.css';

/** Titre de page : `<h1>` visible et titre du document (WCAG 2.4.2), hissé dans `<head>` par React 19. */
export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className={styles.header}>
      <title>{`${title} – Qualineo`}</title>
      <h1 className={styles.title}>{title}</h1>
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}
