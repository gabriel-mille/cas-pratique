import { request } from './client';
import type {
  Action,
  ActionDetail,
  ActionPlan,
  ActionStatus,
  AddedMember,
  AddMemberRequest,
  ChangePasswordRequest,
  CurrentMember,
  LoginRequest,
  Member,
  RegisterRequest,
  Role,
  Session,
  TitledRequest,
} from './types';

const id = (value: string) => encodeURIComponent(value);

/** Requêtes de base de l'API (FSD : `shared/api`), une fonction par route du contrat OpenAPI. */
export const api = {
  register: (body: RegisterRequest) => request<Session>('/api/auth/register', { method: 'POST', body }),
  login: (body: LoginRequest) => request<Session>('/api/auth/login', { method: 'POST', body }),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  changePassword: (body: ChangePasswordRequest) => request<void>('/api/auth/password', { method: 'POST', body }),
  me: () => request<CurrentMember>('/api/me'),

  members: () => request<Member[]>('/api/members'),
  addMember: (body: AddMemberRequest) => request<AddedMember>('/api/members', { method: 'POST', body }),
  changeRole: (userId: string, role: Role) =>
    request<void>(`/api/members/${id(userId)}`, { method: 'PATCH', body: { role } }),
  removeMember: (userId: string) => request<void>(`/api/members/${id(userId)}`, { method: 'DELETE' }),

  plans: () => request<ActionPlan[]>('/api/action-plans'),
  plan: (planId: string) => request<ActionPlan>(`/api/action-plans/${id(planId)}`),
  createPlan: (body: TitledRequest) => request<ActionPlan>('/api/action-plans', { method: 'POST', body }),
  updatePlan: (plan: Pick<ActionPlan, 'id' | 'version'>, body: TitledRequest) =>
    request<ActionPlan>(`/api/action-plans/${id(plan.id)}`, { method: 'PUT', body, version: plan.version }),

  planActions: (planId: string) => request<Action[]>(`/api/action-plans/${id(planId)}/actions`),
  addAction: (planId: string, body: TitledRequest) =>
    request<ActionDetail>(`/api/action-plans/${id(planId)}/actions`, { method: 'POST', body }),
  action: (actionId: string) => request<ActionDetail>(`/api/actions/${id(actionId)}`),
  updateAction: (action: Pick<Action, 'id' | 'version'>, body: TitledRequest) =>
    request<ActionDetail>(`/api/actions/${id(action.id)}`, { method: 'PUT', body, version: action.version }),
  changeStatus: (action: Pick<Action, 'id' | 'version'>, to: ActionStatus) =>
    request<ActionDetail>(`/api/actions/${id(action.id)}/status`, { method: 'POST', body: { to }, version: action.version }),
  rejectValidation: (action: Pick<Action, 'id' | 'version'>, reason: string) =>
    request<ActionDetail>(`/api/actions/${id(action.id)}/rejection`, {
      method: 'POST',
      body: { reason },
      version: action.version,
    }),
  deleteAction: (action: Pick<Action, 'id' | 'version'>) =>
    request<void>(`/api/actions/${id(action.id)}`, { method: 'DELETE', version: action.version }),
};
