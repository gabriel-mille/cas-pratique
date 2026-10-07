import type { components } from './schema';

/** Types générés depuis le contrat OpenAPI du back (`nx run frontend:generate-api`, D26). */
type Schemas = components['schemas'];

export type Role = Schemas['CurrentMemberResponse']['role'];
export type ActionStatus = Schemas['ActionResponse']['status'];
export type CurrentMember = Schemas['CurrentMemberResponse'];
export type Session = Schemas['SessionResponse'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type LoginRequest = Schemas['LoginRequest'];
export type ChangePasswordRequest = Schemas['ChangePasswordRequest'];
export type Member = Schemas['MemberResponse'];
export type AddMemberRequest = Schemas['AddMemberRequest'];
export type AddedMember = Schemas['AddedMemberResponse'];
export type ActionPlan = Schemas['ActionPlanResponse'];
export type TitledRequest = Schemas['TitledRequest'];
export type Action = Schemas['ActionResponse'];
export type ActionDetail = Schemas['ActionDetailResponse'];
export type StatusChange = Schemas['StatusChangeResponse'];
