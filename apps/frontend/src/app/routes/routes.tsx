import { Navigate, type RouteObject } from 'react-router';
import { ActionPage } from '@/pages/action';
import { ActionPlanPage } from '@/pages/action-plan';
import { ActionPlansPage } from '@/pages/action-plans';
import { ChangePasswordPage } from '@/pages/change-password';
import { LoginPage } from '@/pages/login';
import { MembersPage } from '@/pages/members';
import { NotFoundPage } from '@/pages/not-found';
import { RegisterPage } from '@/pages/register';
import { paths } from '@/shared/routes';
import { PublicLayout } from './public-layout';
import { RequireSession } from './require-session';

/** Table des routes, partagée par le routeur du navigateur et les routeurs en mémoire des tests. */
export const routes: RouteObject[] = [
  {
    element: <PublicLayout />,
    children: [
      { path: paths.login, element: <LoginPage /> },
      { path: paths.register, element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireSession />,
    children: [
      { path: paths.home, element: <Navigate to={paths.actionPlans} replace /> },
      { path: paths.actionPlans, element: <ActionPlansPage /> },
      { path: paths.actionPlan(), element: <ActionPlanPage /> },
      { path: paths.action(), element: <ActionPage /> },
      { path: paths.members, element: <MembersPage /> },
      { path: paths.changePassword, element: <ChangePasswordPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
