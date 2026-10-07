import { useId } from 'react';
import styles from './select-field.module.css';

export interface SelectFieldProps {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue?: string;
  /** Libellé masqué visuellement quand le contexte (ligne de tableau) le rend évident. */
  hideLabel?: boolean;
}

/** `<select>` natif : accessible au clavier et aux lecteurs d'écran sans surcouche. */
export function SelectField({ label, name, options, defaultValue, hideLabel }: SelectFieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? styles.visuallyHidden : styles.label}>
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className={styles.control}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
