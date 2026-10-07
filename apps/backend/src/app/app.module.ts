import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../database/database.module';
import { databaseSettingsFromEnv, typeOrmOptions } from '../database/typeorm-options';
import { ActionPlansModule } from '../modules/action-plans/action-plans.module';
import { IdentityModule } from '../modules/identity/identity.module';
import { SessionGuard } from '../modules/identity/presentation/session.guard';
import { OriginGuard } from '../shared/presentation/origin.guard';
import { validateEnvironment } from './environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${__dirname}/../.env`,
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule.forRoot({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...typeOrmOptions(
          databaseSettingsFromEnv({
            DATABASE_HOST: config.get('DATABASE_HOST'),
            DATABASE_PORT: config.get('DATABASE_PORT'),
            DATABASE_USER: config.get('DATABASE_USER'),
            DATABASE_PASSWORD: config.get('DATABASE_PASSWORD'),
            DATABASE_NAME: config.get('DATABASE_NAME'),
          }),
        ),
        // Applique au démarrage les migrations manquantes (option `migrationsRun`, doc TypeORM *DataSource options*).
        migrationsRun: true,
      }),
    }),
    IdentityModule,
    ActionPlansModule,
  ],
  providers: [
    // Guards globaux, exécutés dans l'ordre : origine (D25) avant session (D16), pour ne rien lire en base sur une requête refusée.
    { provide: APP_GUARD, useClass: OriginGuard },
    { provide: APP_GUARD, useClass: SessionGuard },
  ],
})
export class AppModule {}
