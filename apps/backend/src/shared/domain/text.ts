import { ValidationError } from './errors';

// Longueurs maximales (D11) : choix du projet, sans source normative.
export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;

/** Longueur en caractères (points de code), comme `varchar(n)` dans PostgreSQL. */
const length = (value: string) => [...value].length;

export function requireTitle(value: string): string {
  const title = value.trim();
  if (!title) {
    throw new ValidationError('Le titre est obligatoire');
  }
  if (length(title) > TITLE_MAX_LENGTH) {
    throw new ValidationError(`Le titre dépasse ${TITLE_MAX_LENGTH} caractères`);
  }
  return title;
}

export function optionalDescription(value: string | null): string | null {
  const description = value?.trim() || null;
  if (description && length(description) > DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError(`La description dépasse ${DESCRIPTION_MAX_LENGTH} caractères`);
  }
  return description;
}
