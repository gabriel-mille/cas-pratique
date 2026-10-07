import type { z } from 'zod';

export type FieldErrors = Partial<Record<string, string>>;

export type Validation<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

/** Valide les champs d'un formulaire avec un schéma zod ; garde le premier message par champ. */
export function validateForm<T>(schema: z.ZodType<T>, form: HTMLFormElement): Validation<T> {
  const result = schema.safeParse(Object.fromEntries(new FormData(form)));
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? 'form');
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}
