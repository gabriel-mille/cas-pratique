import { Navigate, Outlet, useLocation } from 'react-router';
import { ApiError, errorMessage } from '@/shared/api';
import { MemberProvider, useCurrentMember } from '@/shared/auth';
import { paths } from '@/shared/routes';
import { Alert } from '@/shared/ui/alert';
import { Loading } from '@/shared/ui/loading';
import { AppLayout } from '@/widgets/app-layout';

/**
 * Garde des pages connectées. Confort uniquement : chaque route de l'API vérifie elle-même la session (D15).
 * Avec un mot de passe temporaire, seule la page de changement est accessible (D8).
 */
export function RequireSession() {
  const me = useCurrentMember();
  const location = useLocation();

  if (me.isPending) {
    return <Loading />;
  }
  if (me.isError) {
    return me.error instanceof ApiError && me.error.status === 401 ? (
      <Navigate to={paths.login} replace />
    ) : (
      <main>
        <Alert>{errorMessage(me.error)}</Alert>
      </main>
    );
  }
  if (me.data.mustChangePassword && location.pathname !== paths.changePassword) {
    return <Navigate to={paths.changePassword} replace />;
  }
  return (
    <MemberProvider member={me.data}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </MemberProvider>
  );
}
