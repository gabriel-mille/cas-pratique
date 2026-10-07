import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'node:fs';
import { AppModule } from './app/app.module';
import { configureHttp } from './app/configure-http';
import { buildOpenApiDocument } from './app/openapi';

/**
 * Écrit le contrat OpenAPI sans démarrer l'API ni ouvrir de connexion :
 * le mode `preview` de NestFactory construit le graphe des modules sans instancier les providers.
 */
async function generate(outputPath: string) {
  // Le secret n'est pas utilisé en mode preview, mais la validation de l'environnement l'exige.
  process.env['JWT_SECRET'] ??= 'placeholder-secret-for-openapi-generation';
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  configureHttp(app);
  writeFileSync(outputPath, `${JSON.stringify(buildOpenApiDocument(app), null, 2)}\n`);
  await app.close();
}

const [outputPath] = process.argv.slice(2);
if (!outputPath) {
  throw new Error('Usage : node generate-openapi.js <fichier de sortie>');
}
void generate(outputPath);
