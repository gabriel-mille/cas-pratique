import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { configureHttp, GLOBAL_PREFIX } from './app/configure-http';

async function bootstrap() {
  // Logs JSON (ConsoleLogger `json`, NestJS ≥ 11) : exploitables par un collecteur (D22).
  const app = await NestFactory.create(AppModule, { logger: new ConsoleLogger({ json: true }) });
  configureHttp(app);
  app.enableShutdownHooks();

  // Contrat OpenAPI, source des types du front (D26) ; non exposé en production (D34).
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Qualineo – Plans d’actions')
      .setVersion('1.0')
      .addCookieAuth('session')
      .build();
    SwaggerModule.setup(`${GLOBAL_PREFIX}/docs`, app, () => SwaggerModule.createDocument(app, config));
  }

  const port = process.env['PORT'] || 3000;
  await app.listen(port);
  Logger.log(`Application démarrée : http://localhost:${port}/${GLOBAL_PREFIX}`);
}

void bootstrap();
