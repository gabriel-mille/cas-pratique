import { z } from 'zod';
import { emailSchema, LIMITS, nameSchema, newPasswordSchema } from '@/shared/api';

export const registerSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, 'Le nom de l’organisation est obligatoire')
    .max(LIMITS.name, `Le nom de l’organisation dépasse ${LIMITS.name} caractères`),
  name: nameSchema,
  email: emailSchema,
  password: newPasswordSchema,
});
