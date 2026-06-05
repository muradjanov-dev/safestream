import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@safestream/database';
import { RedisModule } from '@safestream/redis';
import { EventsModule } from '@safestream/events';
import { LoggerModule } from '@safestream/logger';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    DatabaseModule.forRoot(),
    RedisModule,
    EventsModule.forRoot(),
    LoggerModule,
    ModerationModule,
  ],
})
export class AppModule {}
