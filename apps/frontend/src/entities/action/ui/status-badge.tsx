import type { ActionStatus } from '@/shared/api';
import { STATUS_LABELS } from '../model/status';
import styles from './status-badge.module.css';

/** L'état est porté par le texte ; la couleur n'est qu'un renfort (WCAG 1.4.1). */
export function StatusBadge({ status }: { status: ActionStatus }) {
  return <span className={`${styles.badge} ${styles[status]}`}>{STATUS_LABELS[status]}</span>;
}
