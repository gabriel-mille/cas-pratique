import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import {
  AuthenticationError,
  ConflictError,
  ForbiddenError,
  InvalidTransitionError,
  NotFoundError,
  StaleVersionError,
  ValidationError,
} from '../domain/errors';
import { HttpProblem } from './http-problem';
import { toProblem } from './problem-details';

describe('toProblem (RFC 9457)', () => {
  it.each([
    [new ValidationError('Le titre est obligatoire'), 400, 'validation-failed'],
    [new AuthenticationError('Email ou mot de passe incorrect'), 401, 'authentication-failed'],
    [new ForbiddenError('Rôle insuffisant'), 403, 'forbidden'],
    [new NotFoundError('Action introuvable'), 404, 'not-found'],
    [new InvalidTransitionError('Transition invalide'), 409, 'invalid-transition'],
    [new ConflictError('Email déjà utilisé'), 409, 'conflict'],
    [new StaleVersionError('Version périmée'), 412, 'stale-version'],
  ])('traduit %o en %i', (error, status, code) => {
    expect(toProblem(error)).toEqual({
      type: `/problems/${code}`,
      title: expect.any(String),
      status,
      detail: error.message,
      code,
    });
  });

  it('garde le code d’une erreur HTTP propre à l’API', () => {
    expect(toProblem(new HttpProblem(428, 'precondition-required', 'If-Match requis'))).toMatchObject({
      type: '/problems/precondition-required',
      status: 428,
      detail: 'If-Match requis',
      code: 'precondition-required',
    });
  });

  it('liste les erreurs de format du ValidationPipe', () => {
    const exception = new BadRequestException(['title must be a string', 'to must be one of the following values']);

    expect(toProblem(exception)).toMatchObject({
      status: 400,
      code: 'validation-failed',
      errors: ['title must be a string', 'to must be one of the following values'],
    });
  });

  it.each([
    [new NotFoundException('Cannot GET /api/inconnue'), 404, 'not-found'],
    [new ThrottlerException(), 429, 'too-many-requests'],
  ])('traduit les exceptions HTTP de Nest (%o)', (exception, status, code) => {
    expect(toProblem(exception)).toMatchObject({ status, code });
  });

  it('ne divulgue rien d’une erreur inattendue (ASVS 16.5.1)', () => {
    const problem = toProblem(new Error('connect ECONNREFUSED 10.0.0.12:5432'));

    expect(problem).toEqual({
      type: '/problems/internal-error',
      title: expect.any(String),
      status: 500,
      detail: 'Une erreur inattendue est survenue',
      code: 'internal-error',
    });
  });
});
