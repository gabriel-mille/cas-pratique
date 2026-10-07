import { Outlet } from 'react-router';
import styles from './public-layout.module.css';

/** Pages accessibles sans session : connexion et création d'organisation. */
export function PublicLayout() {
  return (
    <main className={styles.main}>
      <p className={styles.brand}>Qualineo · Plans d’actions</p>
      <Outlet />
    </main>
  );
}
