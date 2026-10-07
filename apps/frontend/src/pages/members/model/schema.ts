import { z } from 'zod';
import { emailSchema, nameSchema } from '@/shared/api';

const role = z.enum(['MEMBER', 'MANAGER', 'ADMIN'], 'Le rôle est invalide');

export const addMemberSchema = z.object({ email: emailSchema, name: nameSchema, role });

export const changeRoleSchema = z.object({ role });
