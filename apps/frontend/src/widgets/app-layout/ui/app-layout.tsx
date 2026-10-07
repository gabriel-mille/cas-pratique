import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { can, ROLE_LABELS } from '@/entities/member';
import { useLogout, useMember } from '@/shared/auth';
import { paths } from '@/shared/routes';
import { Button } from '@/shared/ui/button';
import styles from './app-layout.module.css';

/** Cadre des pages connectées : lien d'évitement (WCAG 2.4.1), navigation, compte et déconnexion. */
export function AppLayout({ children }: { children: ReactNode }) {
  const member = useMember();
  const navigate = useNavigate();
  const logout = useLogout(() => navigate(paths.login, { replace: true }));

  return (
    <div className={styles.layout}>
      <a href="#main" className={styles.skipLink}>
        Aller au contenu
      </a>
      <header className={styles.header}>
        <p className={styles.organization}>{member.organizationName}</p>
        {/* Avec un mot de passe temporaire, seul son changement est permis (D8) : pas de navigation. */}
        {!member.mustChangePassword && (
          <nav aria-label="Navigation principale">
            <ul className={styles.nav}>
              <li>
                <NavLink to={paths.actionPlans}>Plans d’actions</NavLink>
              </li>
              {can(member.role, 'manage-members') && (
                <li>
                  <NavLink to={paths.members}>Membres</NavLink>
                </li>
              )}
            </ul>
          </nav>
        )}
        <div className={styles.account}>
          <span>
            {member.name} · {ROLE_LABELS[member.role]}
          </span>
          {!member.mustChangePassword && <Link to={paths.changePassword}>Changer mon mot de passe</Link>}
          <Button onClick={() => logout.mutate()} disabled={logout.isPending}>
            Se déconnecter
          </Button>
        </div>
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
    </div>
  );
}
