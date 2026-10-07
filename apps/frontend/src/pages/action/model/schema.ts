import { z } from 'zod';
import { LIMITS } from '@/shared/api';

/** Motif de refus obligatoire (D4), longueur bornée (D34). */
export const rejectionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, 'Le motif est obligatoire')
    .max(LIMITS.reason, `Le motif dépasse ${LIMITS.reason} caractères`),
});
