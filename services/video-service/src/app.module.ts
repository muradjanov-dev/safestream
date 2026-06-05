import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '@safestream/database';
import { RedisModule } from '@safestream/redis';
import { EventsModule } from '@safestream/events';
import { LoggerModule } from '@safestream/logger';
import { StorageModule } from '@safestream/storage';
import { VideosModule } from './video/videos.module';
import { UploadModule } from './upload/upload.module';
import { StreamingModule } from './streaming/streaming.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule.forRoot(),
    RedisModule,
    EventsModule.forRoot(),
    LoggerModule,
    StorageModule,
    VideosModule,
    UploadModule,
    StreamingModule,
  ],
})
export class AppModule {}
