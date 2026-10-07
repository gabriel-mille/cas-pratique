import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { databaseSettingsFromEnv, typeOrmOptions } from '../database/typeorm-options';
import { ActionPlansModule } from '../modules/action-plans/action-plans.module';
import { IdentityModule } from '../modules/identity/identity.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${__dirname}/../.env`,
      isGlobal: true,
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
})
export class AppModule {}
