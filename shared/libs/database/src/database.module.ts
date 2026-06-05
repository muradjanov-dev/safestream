import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
            type: 'postgres',
            url: config.get<string>('DATABASE_URL'),
            entities: [__dirname + '/entities/**/*.entity{.ts,.js}'],
            migrations: [__dirname + '/../../database/migrations/**/*{.ts,.js}'],
            synchronize: config.get('NODE_ENV') === 'development',
            logging: config.get('NODE_ENV') === 'development',
            ssl:
              config.get('NODE_ENV') === 'production'
                ? { rejectUnauthorized: false }
                : false,
            poolSize: config.get<number>('DATABASE_POOL_MAX', 20),
            extra: {
              min: config.get<number>('DATABASE_POOL_MIN', 2),
            },
          }),
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}
