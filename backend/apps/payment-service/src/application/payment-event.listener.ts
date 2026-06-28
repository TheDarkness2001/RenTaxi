import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventBusService, EventType, TripStatusChangedPayload } from '@taxi/events';

@Injectable()
export class PaymentEventListener implements OnModuleInit {
  private readonly logger = new Logger(PaymentEventListener.name);

  constructor(private readonly eventBus: EventBusService) {}

  onModuleInit() {
    this.eventBus.subscribe(EventType.TRIP_STATUS_CHANGED, async (event) => {
      const payload = event.payload as TripStatusChangedPayload;
      if (payload.toStatus === 'completed') {
        this.logger.log(`Trip ${payload.tripId} completed — ready for payment`);
        await this.eventBus.publish(EventType.TRIP_STATUS_CHANGED, {
          ...payload,
          toStatus: 'payment_processing',
        });
      }
    });
  }
}
