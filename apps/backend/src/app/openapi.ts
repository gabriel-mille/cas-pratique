import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Contrat OpenAPI de l'API : servi par Swagger UI hors production, et source des types du front (D26). */
export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Qualineo – Plans d’actions')
    .setVersion('1.0')
    .addCookieAuth('session')
    .build();
  return SwaggerModule.createDocument(app, config);
}
