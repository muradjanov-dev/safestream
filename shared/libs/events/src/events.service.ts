import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_EXCHANGE, EventName } from './events.constants';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly amqp: AmqpConnection) {}

  async publish<T extends object>(event: EventName, payload: T): Promise<void> {
    try {
      await this.amqp.publish(RABBITMQ_EXCHANGE, event, payload);
      this.logger.debug(`Published event: ${event}`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${event}`, error);
      throw error;
    }
  }
}
