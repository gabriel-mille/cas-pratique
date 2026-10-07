import { type FormEvent, useState } from 'react';
import { type TitledRequest, titledRequestSchema } from '@/shared/api';
import { type FieldErrors, validateForm } from '@/shared/lib/form';
import { Alert } from '../alert';
import { Button } from '../button';
import { TextField } from '../text-field';
import styles from './titled-form.module.css';

export interface TitledFormProps {
  defaultValues?: { title: string; description: string | null };
  submitLabel: string;
  pending: boolean;
  /** Erreur du back, affichée dans le formulaire (WCAG 3.3.1). */
  error?: string;
  onSubmit: (body: TitledRequest) => void;
  onCancel: () => void;
}

/** Formulaire titre + description, commun aux plans et aux actions (D6, D11). */
export function TitledForm({ defaultValues, submitLabel, pending, error, onSubmit, onCancel }: TitledFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateForm(titledRequestSchema, event.currentTarget);
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) onSubmit(result.data);
  };
  return (
    <form noValidate onSubmit={submit}>
      {error && <Alert>{error}</Alert>}
      <p className={styles.note}>Les champs marqués d’un astérisque (*) sont obligatoires.</p>
      <TextField label="Titre" name="title" required defaultValue={defaultValues?.title} error={errors['title']} />
      <TextField
        label="Description"
        name="description"
        multiline
        defaultValue={defaultValues?.description}
        error={errors['description']}
      />
      <div className={styles.actions}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
