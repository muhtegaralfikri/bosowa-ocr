import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { DeleteRequestsModule } from './modules/delete-requests/delete-requests.module';
import { EditLogsModule } from './modules/edit-logs/edit-logs.module';
import { FilesModule } from './modules/files/files.module';
import { LettersModule } from './modules/letters/letters.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { StatsModule } from './modules/stats/stats.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const username = config.getOrThrow<string>('DB_USER');
        const password =
          config.get<string>('DB_PASSWORD') ??
          config.get<string>('DB_PASS') ??
          (() => {
            throw new Error('DB_PASSWORD is not set');
          })();
        const database = config.getOrThrow<string>('DB_NAME');

        return {
          type: 'mysql',
          host: config.get<string>('DB_HOST') || 'localhost',
          port: +(config.get<string>('DB_PORT') || 3306),
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV !== 'production',
        };
      },
    }),
    AuthModule,
    UsersModule,
    FilesModule,
    OcrModule,
    LettersModule,
    DeleteRequestsModule,
    EditLogsModule,
    StatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
