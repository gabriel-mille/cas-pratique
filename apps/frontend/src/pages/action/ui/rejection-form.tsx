import { type FormEvent, useState } from 'react';
import { type FieldErrors, validateForm } from '@/shared/lib/form';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { TextField } from '@/shared/ui/text-field';
import { rejectionSchema } from '../model/schema';
import styles from './action-page.module.css';

interface RejectionFormProps {
  pending: boolean;
  error?: string;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

export function RejectionForm({ pending, error, onSubmit, onCancel }: RejectionFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateForm(rejectionSchema, event.currentTarget);
    setErrors(result.ok ? {} : result.errors);
    if (result.ok) onSubmit(result.data.reason);
  };
  return (
    <form noValidate onSubmit={submit}>
      {error && <Alert>{error}</Alert>}
      <p>L’action repassera « En cours ». Le motif sera visible dans son historique.</p>
      <TextField label="Motif du refus" name="reason" multiline required error={errors['reason']} />
      <div className={styles.dialogActions}>
        <Button onClick={onCancel}>Annuler</Button>
        <Button type="submit" variant="danger" disabled={pending}>
          Confirmer le refus
        </Button>
      </div>
    </form>
  );
}
