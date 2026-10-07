import { z } from 'zod';

/**
 * Limites du back (D11, D13, D34) recopiées pour prévenir l'utilisateur avant l'envoi.
 * Le back revalide tout : ces schémas n'apportent que du confort.
 */
export const LIMITS = {
  title: 200,
  description: 5000,
  name: 200,
  reason: 2000,
  email: 254,
  passwordMin: 15,
  passwordMax: 128,
} as const;

export const titledRequestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Le titre est obligatoire')
    .max(LIMITS.title, `Le titre dépasse ${LIMITS.title} caractères`),
  description: z
    .string()
    .trim()
    .max(LIMITS.description, `La description dépasse ${LIMITS.description} caractères`)
    .transform((value) => value || null),
});

export const newPasswordSchema = z
  .string()
  .min(LIMITS.passwordMin, `Le mot de passe fait moins de ${LIMITS.passwordMin} caractères`)
  .max(LIMITS.passwordMax, `Le mot de passe dépasse ${LIMITS.passwordMax} caractères`);

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'L’email est obligatoire')
  .max(LIMITS.email, `L’email dépasse ${LIMITS.email} caractères`)
  .pipe(z.email('L’adresse email est invalide'));

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Le nom est obligatoire')
  .max(LIMITS.name, `Le nom dépasse ${LIMITS.name} caractères`);
