import { STATUS_LABELS } from '@/entities/action';
import type { StatusChange } from '@/shared/api';
import styles from './action-page.module.css';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

/** Historique des changements d'état (D5), avec auteur, date et motif de refus. */
export function StatusHistory({ history }: { history: readonly StatusChange[] }) {
  if (history.length === 0) {
    return <p>Aucun changement d’état pour l’instant.</p>;
  }
  return (
    <ol aria-label="Historique des changements d’état" className={styles.history}>
      {history.map((change) => (
        <li key={`${change.at}-${change.to}`}>
          {`${STATUS_LABELS[change.from]} → ${STATUS_LABELS[change.to]} par ${change.author.name ?? 'un compte supprimé'}, le `}
          <time dateTime={change.at}>{dateFormat.format(new Date(change.at))}</time>
          {change.reason && <p className={styles.reason}>{`Motif : ${change.reason}`}</p>}
        </li>
      ))}
    </ol>
  );
}
