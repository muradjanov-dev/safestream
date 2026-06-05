import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '@safestream/database';
import { RedisModule } from '@safestream/redis';
import { EventsModule } from '@safestream/events';
import { LoggerModule } from '@safestream/logger';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { MfaModule } from './mfa/mfa.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule.forRoot(),
    RedisModule,
    EventsModule.forRoot(),
    LoggerModule,
    AuthModule,
    SessionsModule,
    MfaModule,
    HealthModule,
  ],
})
export class AppModule {}
