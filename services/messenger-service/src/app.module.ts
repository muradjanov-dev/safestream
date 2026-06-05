import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@safestream/database';
import { RedisModule } from '@safestream/redis';
import { EventsModule } from '@safestream/events';
import { LoggerModule } from '@safestream/logger';
import { StorageModule } from '@safestream/storage';
import { Message } from '@safestream/database';
import { MessengerGateway } from './gateway/messenger.gateway';
import { MessagesService } from './messages/messages.service';
import { ConversationsService } from './conversations/conversations.service';
import { ConversationsController } from './conversations/conversations.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({ secret: c.get('JWT_ACCESS_SECRET') }),
    }),
    DatabaseModule.forRoot(),
    RedisModule,
    EventsModule.forRoot(),
    LoggerModule,
    StorageModule,
    TypeOrmModule.forFeature([Message]),
  ],
  providers: [MessengerGateway, MessagesService, ConversationsService],
  controllers: [ConversationsController],
})
export class AppModule {}
