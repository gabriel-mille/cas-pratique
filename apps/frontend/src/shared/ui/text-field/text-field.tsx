import { useId } from 'react';
import styles from './text-field.module.css';

export interface TextFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password';
  multiline?: boolean;
  defaultValue?: string | null;
  /** Message d'erreur lié au champ par `aria-describedby` (WCAG 3.3.1). */
  error?: string;
  hint?: string;
  required?: boolean;
  autoComplete?: string;
}

/** Champ libellé ; la validation est faite par le formulaire (zod), pas par le navigateur. */
export function TextField({
  label,
  name,
  type = 'text',
  multiline,
  defaultValue,
  error,
  hint,
  required,
  autoComplete,
}: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const control = {
    id,
    name,
    defaultValue: defaultValue ?? undefined,
    autoComplete,
    'aria-required': required || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
    className: styles.control,
  };
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {multiline ? <textarea rows={4} {...control} /> : <input type={type} {...control} />}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  );
}
