import { useMutation } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { api, errorMessage, LIMITS } from '@/shared/api';
import { useSessionChange } from '@/shared/auth';
import { type FieldErrors, validateForm } from '@/shared/lib/form';
import { paths } from '@/shared/routes';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { TextField } from '@/shared/ui/text-field';
import { registerSchema } from '../model/schema';

/** US1 : la création du compte crée l'organisation, dont on devient l'Administrateur. */
export function RegisterPage() {
  const navigate = useNavigate();
  const resetSession = useSessionChange();
  const [errors, setErrors] = useState<FieldErrors>({});
  const register = useMutation({
    mutationFn: api.register,
    onSuccess: () => {
      resetSession();
      navigate(paths.actionPlans, { replace: true });
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateForm(registerSchema, event.currentTarget);
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) register.mutate(result.data);
  };

  return (
    <>
      <PageHeader title="Créer une organisation" />
      {register.isError && <Alert>{errorMessage(register.error)}</Alert>}
      <form noValidate onSubmit={submit}>
        <p>Les champs marqués d’un astérisque (*) sont obligatoires.</p>
        <TextField
          label="Nom de l’organisation"
          name="organizationName"
          autoComplete="organization"
          required
          error={errors['organizationName']}
        />
        <TextField label="Votre nom" name="name" autoComplete="name" required error={errors['name']} />
        <TextField label="Email" name="email" type="email" autoComplete="email" required error={errors['email']} />
        <TextField
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint={`Au moins ${LIMITS.passwordMin} caractères. Une phrase de plusieurs mots est plus facile à retenir.`}
          error={errors['password']}
        />
        <Button type="submit" variant="primary" disabled={register.isPending}>
          Créer l’organisation
        </Button>
      </form>
      <p>
        Déjà un compte ? <Link to={paths.login}>Se connecter</Link>
      </p>
    </>
  );
}
