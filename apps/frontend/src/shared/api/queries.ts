import { queryOptions } from '@tanstack/react-query';
import { api } from './endpoints';

/** Clés et lectures partagées (TanStack Query `queryOptions`) : une seule définition par ressource. */
export const queries = {
  me: () => queryOptions({ queryKey: ['me'], queryFn: api.me }),
  members: () => queryOptions({ queryKey: ['members'], queryFn: api.members }),
  plans: () => queryOptions({ queryKey: ['action-plans'], queryFn: api.plans }),
  plan: (planId: string) => queryOptions({ queryKey: ['action-plans', planId], queryFn: () => api.plan(planId) }),
  planActions: (planId: string) =>
    queryOptions({ queryKey: ['action-plans', planId, 'actions'], queryFn: () => api.planActions(planId) }),
  action: (actionId: string) => queryOptions({ queryKey: ['actions', actionId], queryFn: () => api.action(actionId) }),
};
