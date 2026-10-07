import { ValidationError } from './errors';

// Longueurs maximales (D11) : choix du projet, sans source normative.
export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;

export const NAME_MAX_LENGTH = 200;

/** Longueur en caractères (points de code), comme `varchar(n)` dans PostgreSQL. */
export const length = (value: string) => [...value].length;

function requireText(value: string, label: string, max: number): string {
  const text = value.trim();
  if (!text) {
    throw new ValidationError(`${label} est obligatoire`);
  }
  if (length(text) > max) {
    throw new ValidationError(`${label} dépasse ${max} caractères`);
  }
  return text;
}

export function requireTitle(value: string): string {
  return requireText(value, 'Le titre', TITLE_MAX_LENGTH);
}

/** Nom d'une personne ou d'une organisation. */
export function requireName(value: string, label: string): string {
  return requireText(value, label, NAME_MAX_LENGTH);
}

export function optionalDescription(value: string | null): string | null {
  const description = value?.trim() || null;
  if (description && length(description) > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`La description dépasse ${DESCRIPTION_MAX_LENGTH} caractères`);
  }
  return description;
}
