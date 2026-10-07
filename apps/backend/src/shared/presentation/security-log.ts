import { Logger } from '@nestjs/common';

const logger = new Logger('Security');

/**
 * Événements de sécurité (D22, ASVS 16.3.1 et 16.3.2) : qui, quoi, quand (horodatage du logger).
 * Jamais de mot de passe ni d'identifiant non reconnu : un email inconnu peut être un mot de passe mal saisi.
 */
export const securityLog = {
  loginSucceeded: (userId: string, organizationId: string, ip: string | undefined) =>
    logger.log({ event: 'login.succeeded', userId, organizationId, ip }),
  loginFailed: (ip: string | undefined) => logger.warn({ event: 'login.failed', ip }),
  accessDenied: (code: string, method: string, path: string, userId: string | undefined, ip: string | undefined) =>
    logger.warn({ event: 'access.denied', code, method, path, userId, ip }),
  throttled: (method: string, path: string, ip: string | undefined) =>
    logger.warn({ event: 'request.throttled', method, path, ip }),
};
