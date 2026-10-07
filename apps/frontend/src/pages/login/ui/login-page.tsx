import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api, errorMessage } from '@/shared/api';
import { useSessionChange } from '@/shared/auth';
import { type FieldErrors, validateForm } from '@/shared/lib/form';
import { paths } from '@/shared/routes';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { TextField } from '@/shared/ui/text-field';
import { loginSchema } from '../model/schema';

export function LoginPage() {
  const navigate = useNavigate();
  const resetSession = useSessionChange();
  const [errors, setErrors] = useState<FieldErrors>({});
  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (session) => {
      resetSession();
      navigate(session.mustChangePassword ? paths.changePassword : paths.actionPlans, { replace: true });
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateForm(loginSchema, event.currentTarget);
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) login.mutate(result.data);
  };

  return (
    <>
      <PageHeader title="Connexion" />
      {login.isError && <Alert>{errorMessage(login.error)}</Alert>}
      <form noValidate onSubmit={submit}>
        <TextField label="Email" name="email" type="email" autoComplete="username" required error={errors['email']} />
        <TextField
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={errors['password']}
        />
        <Button type="submit" variant="primary" disabled={login.isPending}>
          Se connecter
        </Button>
      </form>
      <p>
        Pas encore de compte ? <Link to={paths.register}>Créer une organisation</Link>
      </p>
    </>
  );
}
