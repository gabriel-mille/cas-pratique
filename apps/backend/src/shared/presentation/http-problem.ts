import { HttpException } from '@nestjs/common';

/** Erreur propre à la couche HTTP (428, 403 d'origine…), avec son code de problème (RFC 9457). */
export class HttpProblem extends HttpException {
  constructor(
    status: number,
    readonly code: string,
    detail: string,
  ) {
    super(detail, status);
  }
}
