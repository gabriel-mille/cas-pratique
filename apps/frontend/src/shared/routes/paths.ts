/** Chemins de l'application (FSD : constantes de routes dans `shared/routes`). */
export const paths = {
  home: '/',
  login: '/login',
  register: '/register',
  changePassword: '/change-password',
  actionPlans: '/action-plans',
  actionPlan: (planId = ':planId') => `/action-plans/${planId}`,
  action: (actionId = ':actionId') => `/actions/${actionId}`,
  members: '/members',
} as const;
