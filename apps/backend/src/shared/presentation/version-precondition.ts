import { createParamDecorator, ExecutionContext, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { HttpProblem } from './http-problem';

/** La version de l'agrégat (D14) sert d'ETag fort. */
export const etagOf = (version: number) => `"${version}"`;

/**
 * Version attendue par le client, lue dans `If-Match` (RFC 9110 §13.1.1, D24).
 * Sans version précise, 428 (RFC 6585 §3) : `*` est refusé car il ne protège pas d'une mise à jour perdue.
 * Une valeur qui ne peut égaler un de nos ETags échoue comme une version périmée : 412.
 */
export function parseIfMatch(header: string | undefined): number {
  const value = header?.trim();
  if (!value || value === '*') {
    throw new HttpProblem(
      HttpStatus.PRECONDITION_REQUIRED,
      'precondition-required',
      'En-tête If-Match requis : renvoyez l’ETag de la version lue',
    );
  }
  const match = /^"(\d+)"$/.exec(value);
  if (!match) {
    throw new HttpProblem(HttpStatus.PRECONDITION_FAILED, 'stale-version', 'If-Match ne correspond à aucune version');
  }
  return Number(match[1]);
}

export const IfMatch = createParamDecorator((_: unknown, context: ExecutionContext): number =>
  parseIfMatch(context.switchToHttp().getRequest<Request>().headers['if-match']),
);

/** Ajoute l'ETag de la ressource renvoyée, que le client renverra en If-Match. */
export function withVersion<T extends { version: number }>(response: Response, view: T): T {
  response.setHeader('ETag', etagOf(view.version));
  return view;
}

/** Documentation OpenAPI de l'en-tête exigé par chaque écriture versionnée. */
export const IF_MATCH_HEADER = { name: 'If-Match', required: true, description: 'ETag lu, ex. "3" (D14)' };
