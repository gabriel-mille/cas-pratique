import { z } from 'zod';

/** Pas de règle de format à la connexion : le back répond par un message générique (D13). */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'L’email est obligatoire'),
  password: z.string().min(1, 'Le mot de passe est obligatoire'),
});
