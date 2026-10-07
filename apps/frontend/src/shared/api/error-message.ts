import { ApiError } from './client';

/** Message affichable pour une erreur d'API ; le texte du back est déjà en français. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Le serveur est injoignable. Vérifiez votre connexion puis réessayez.';
  }
  switch (error.code) {
    case 'stale-version':
      return 'Ces données ont été modifiées entre-temps par quelqu’un d’autre. Elles ont été rechargées : vérifiez-les puis recommencez.';
    case 'forbidden':
      return error.detail.startsWith('On ne peut') ? error.detail : 'Vous n’avez pas les droits pour cette opération.';
    case 'too-many-requests':
      return 'Trop de tentatives. Patientez quelques minutes puis réessayez.';
    case 'internal-error':
      return 'Une erreur inattendue est survenue. Réessayez plus tard.';
    default:
      return error.detail;
  }
}

export const isApiError = (error: unknown, code: string): error is ApiError =>
  error instanceof ApiError && error.code === code;
