import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { BaseEvent, EventType } from './events';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private connection: AmqpConnection | null = null;
  private channel: AmqpChannel | null = null;
  private readonly exchange = 'taxi.events';

  async onModuleInit() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://taxi:taxi_secret@localhost:5672';
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      this.logger.log('Event bus connected');
    } catch (error) {
      this.logger.warn('Event bus unavailable — running in degraded mode');
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish<T>(type: EventType, payload: T): Promise<void> {
    if (!this.channel) return;

    const event: BaseEvent<T> = {
      type,
      timestamp: new Date().toISOString(),
      payload,
    };

    this.channel.publish(
      this.exchange,
      type,
      Buffer.from(JSON.stringify(event)),
      { persistent: true },
    );
  }

  async subscribe(
    pattern: string,
    handler: (event: BaseEvent) => Promise<void>,
  ): Promise<void> {
    if (!this.channel) return;

    const queue = await this.channel.assertQueue('', { exclusive: true });
    await this.channel.bindQueue(queue.queue, this.exchange, pattern);
    await this.channel.consume(queue.queue, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString()) as BaseEvent;
        await handler(event);
        this.channel!.ack(msg);
      } catch (error) {
        this.logger.error('Event handler failed', error);
        this.channel!.nack(msg, false, false);
      }
    });
  }
}
