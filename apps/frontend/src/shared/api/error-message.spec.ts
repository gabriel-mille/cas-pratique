import { ApiError } from './client';
import { errorMessage, isApiError } from './error-message';

describe('errorMessage', () => {
  it.each([
    ['stale-version', 412, 'Version périmée', /modifiées entre-temps/],
    ['forbidden', 403, 'Opération interdite', /^Vous n’avez pas les droits/],
    ['forbidden', 403, 'On ne peut pas se retirer soi-même', /^On ne peut pas se retirer soi-même$/],
    ['too-many-requests', 429, 'Too Many Requests', /^Trop de tentatives/],
    ['internal-error', 500, 'Internal Server Error', /^Une erreur inattendue/],
    ['validation-failed', 400, 'Le titre est obligatoire', /^Le titre est obligatoire$/],
  ])('%s (%i) : %s', (code, status, detail, expected) => {
    expect(errorMessage(new ApiError(status, code, detail))).toMatch(expected);
  });

  it('signale un serveur injoignable quand fetch échoue', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toMatch(/^Le serveur est injoignable/);
  });
});

describe('isApiError', () => {
  it('compare le code stable, pas le texte', () => {
    const error = new ApiError(404, 'not-found', 'Action introuvable');
    expect(isApiError(error, 'not-found')).toBe(true);
    expect(isApiError(error, 'forbidden')).toBe(false);
    expect(isApiError(new Error('not-found'), 'not-found')).toBe(false);
  });
});
