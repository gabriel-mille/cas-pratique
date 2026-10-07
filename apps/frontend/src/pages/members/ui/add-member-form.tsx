import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { ROLE_OPTIONS } from '@/entities/member';
import { type AddedMember, api, errorMessage, queries } from '@/shared/api';
import { type FieldErrors, validateForm } from '@/shared/lib/form';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { SelectField } from '@/shared/ui/select-field';
import { TextField } from '@/shared/ui/text-field';
import { addMemberSchema } from '../model/schema';
import styles from './members-page.module.css';

/** US2 : ajout d'un membre ; son mot de passe temporaire n'est montré qu'une fois (D8). */
export function AddMemberForm() {
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [added, setAdded] = useState<(AddedMember & { name: string }) | null>(null);
  const add = useMutation({
    mutationFn: api.addMember,
    onSuccess: async (member, request) => {
      setAdded({ ...member, name: request.name });
      await queryClient.invalidateQueries(queries.members());
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const result = validateForm(addMemberSchema, form);
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) {
      setAdded(null);
      add.mutate(result.data, { onSuccess: () => form.reset() });
    }
  };

  return (
    <section aria-labelledby="add-member" className={styles.section}>
      <h2 id="add-member">Ajouter un membre</h2>
      {added && (
        <Alert tone="success">
          <p>
            {`${added.name} a été ajouté. Mot de passe temporaire : `}
            <code className={styles.password}>{added.temporaryPassword}</code>
          </p>
          <p>
            Transmettez-le de façon sûre : il ne sera plus jamais affiché, et devra être changé à la première connexion.
          </p>
          <Button onClick={() => setAdded(null)}>J’ai transmis le mot de passe</Button>
        </Alert>
      )}
      {add.isError && <Alert>{errorMessage(add.error)}</Alert>}
      <form noValidate onSubmit={submit} className={styles.addForm}>
        <TextField label="Email" name="email" type="email" autoComplete="off" required error={errors['email']} />
        <TextField label="Nom" name="name" autoComplete="off" required error={errors['name']} />
        <SelectField label="Rôle" name="role" options={ROLE_OPTIONS} defaultValue="MEMBER" />
        <Button type="submit" variant="primary" disabled={add.isPending}>
          Ajouter le membre
        </Button>
      </form>
    </section>
  );
}
