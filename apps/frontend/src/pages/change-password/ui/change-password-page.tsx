import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { api, errorMessage, LIMITS, queries } from '@/shared/api';
import { useMember } from '@/shared/auth';
import { type FieldErrors, validateForm } from '@/shared/lib/form';
import { paths } from '@/shared/routes';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { TextField } from '@/shared/ui/text-field';
import { useToast } from '@/shared/ui/toast';
import { changePasswordSchema } from '../model/schema';

/** Changement de mot de passe, imposé tant que le mot de passe est temporaire (D8). */
export function ChangePasswordPage() {
  const member = useMember();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const notify = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const change = useMutation({
    mutationFn: api.changePassword,
    onSuccess: async () => {
      await queryClient.invalidateQueries(queries.me());
      notify('Mot de passe modifié. Vos autres sessions ont été fermées.');
      navigate(paths.actionPlans, { replace: true });
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateForm(changePasswordSchema, event.currentTarget);
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) change.mutate(result.data);
  };

  return (
    <>
      <PageHeader title="Changer votre mot de passe" />
      {member.mustChangePassword && (
        <Alert tone="info">Votre mot de passe est temporaire : choisissez-en un nouveau pour continuer.</Alert>
      )}
      {change.isError && <Alert>{errorMessage(change.error)}</Alert>}
      <form noValidate onSubmit={submit}>
        <TextField
          label="Mot de passe actuel"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          error={errors['currentPassword']}
        />
        <TextField
          label="Nouveau mot de passe"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          hint={`Au moins ${LIMITS.passwordMin} caractères.`}
          error={errors['newPassword']}
        />
        <Button type="submit" variant="primary" disabled={change.isPending}>
          Changer le mot de passe
        </Button>
      </form>
    </>
  );
}
