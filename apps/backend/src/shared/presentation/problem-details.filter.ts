import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AuthenticatedRequest } from './authenticated-request';
import { toProblem } from './problem-details';
import { securityLog } from './security-log';

/** Filtre global : toute erreur sort au format RFC 9457 (D24) ; les refus d'accès sont journalisés (D22). */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const response = http.getResponse<Response>();
    const problem = toProblem(exception);

    if (problem.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    } else if (problem.status === HttpStatus.FORBIDDEN) {
      securityLog.accessDenied(problem.code, request.method, request.originalUrl, request.actor?.userId, request.ip);
    } else if (problem.status === HttpStatus.TOO_MANY_REQUESTS) {
      securityLog.throttled(request.method, request.originalUrl, request.ip);
    }

    response.status(problem.status).type('application/problem+json').json(problem);
  }
}
