import { Module, DynamicModule } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { EventsService } from './events.service';
import { RABBITMQ_EXCHANGE } from './events.constants';

@Module({})
export class EventsModule {
  static forRoot(): DynamicModule {
    return {
      module: EventsModule,
      imports: [
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            exchanges: [
              { name: RABBITMQ_EXCHANGE, type: 'topic' },
            ],
            uri: config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672'),
            connectionInitOptions: { wait: false },
          }),
        }),
      ],
      providers: [EventsService],
      exports: [EventsService, RabbitMQModule],
    };
  }
}
