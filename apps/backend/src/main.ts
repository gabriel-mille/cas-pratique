import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { configureHttp, GLOBAL_PREFIX } from './app/configure-http';
import { buildOpenApiDocument } from './app/openapi';

async function bootstrap() {
  // Logs JSON (ConsoleLogger `json`, NestJS ≥ 11) : exploitables par un collecteur (D22).
  const app = await NestFactory.create(AppModule, { logger: new ConsoleLogger({ json: true }) });
  configureHttp(app);
  app.enableShutdownHooks();

  // Contrat OpenAPI, source des types du front (D26) ; non exposé en production (D34).
  if (process.env['NODE_ENV'] !== 'production') {
    SwaggerModule.setup(`${GLOBAL_PREFIX}/docs`, app, () => buildOpenApiDocument(app));
  }

  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  Logger.log(`Application démarrée : http://localhost:${port}/${GLOBAL_PREFIX}`);
}

void bootstrap();
