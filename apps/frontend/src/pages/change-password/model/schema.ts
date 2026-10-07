import { z } from 'zod';
import { newPasswordSchema } from '@/shared/api';

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est obligatoire'),
  newPassword: newPasswordSchema,
});
