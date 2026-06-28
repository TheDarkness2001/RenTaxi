import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  EventBusService,
  EventType,
  TripStatusChangedPayload,
  DriverLocationPayload,
  IdentityVerifiedPayload,
} from '@taxi/events';
import { NotificationService } from './notification.service';
import { NotificationRepository } from '../infrastructure/notification.repository';

const TRIP_STATUS_MESSAGES: Record<string, { title: string; body: string }> = {
  driver_assigned: { title: 'Haydovchi topildi', body: 'Haydovchingiz yo\'lga chiqdi' },
  driver_arriving: { title: 'Haydovchi yaqinlashmoqda', body: 'Haydovchi manzilingizga yetib kelmoqda' },
  picked_up: { title: 'Safar boshlandi', body: 'Yaxshi safar tilaymiz!' },
  in_progress: { title: 'Safar davom etmoqda', body: 'Manzilga yetib borish vaqti yangilanmoqda' },
  completed: { title: 'Safar yakunlandi', body: 'To\'lovni amalga oshiring' },
  paid: { title: 'To\'lov qabul qilindi', body: 'Safaringizni baholang' },
  cancelled: { title: 'Safar bekor qilindi', body: 'Buyurtmangiz bekor qilindi' },
};

@Injectable()
export class NotificationEventListener implements OnModuleInit {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly notificationService: NotificationService,
    private readonly repo: NotificationRepository,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(EventType.TRIP_STATUS_CHANGED, async (event) => {
      const payload = event.payload as TripStatusChangedPayload;
      const msg = TRIP_STATUS_MESSAGES[payload.toStatus];
      if (!msg) return;

      await this.notificationService.sendToUser(
        payload.passengerId,
        msg.title,
        msg.body,
        `trip.${payload.toStatus}`,
        { tripId: payload.tripId },
      );

      if (payload.driverId && payload.toStatus === 'searching') {
        const driverUserId = await this.repo.getDriverUserId(payload.driverId);
        if (driverUserId) {
          await this.notificationService.sendToUser(
            driverUserId,
            'Yangi buyurtma',
            'Yaqin atrofda yangi buyurtma mavjud',
            'trip.new_offer',
            { tripId: payload.tripId },
          );
        }
      }
    });

    this.eventBus.subscribe(EventType.IDENTITY_VERIFIED, async (event) => {
      const payload = event.payload as IdentityVerifiedPayload;
      await this.notificationService.sendToUser(
        payload.userId,
        'Tasdiqlash muvaffaqiyatli',
        'Endi to\'liq xizmatlardan foydalanishingiz mumkin',
        'identity.verified',
      );
    });

    this.eventBus.subscribe(EventType.PAYMENT_COMPLETED, async (event) => {
      const payload = event.payload as { userId: string; tripId: string; amountUzs: number };
      await this.notificationService.sendToUser(
        payload.userId,
        'To\'lov muvaffaqiyatli',
        `${payload.amountUzs.toLocaleString()} UZS to\'landi`,
        'payment.completed',
        { tripId: payload.tripId },
      );
    });

    this.logger.log('Notification event listeners registered');
  }
}
