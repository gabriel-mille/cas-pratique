import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ProblemDetailsFilter } from '../shared/presentation/problem-details.filter';

export const GLOBAL_PREFIX = 'api';

/** Réglages HTTP communs au serveur (`main.ts`) et aux tests e2e, pour tester ce qui tourne réellement. */
export function configureHttp(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
  // En-têtes de sécurité (ASVS 3.4.x) : CSP, HSTS, nosniff, frame-ancestors…
  app.use(helmet());
  app.use(cookieParser());
  // Champs inconnus refusés plutôt qu'ignorés (doc NestJS *Validation*, ASVS 2.2.1) ; règles métier au domaine (D34).
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ProblemDetailsFilter());
}
