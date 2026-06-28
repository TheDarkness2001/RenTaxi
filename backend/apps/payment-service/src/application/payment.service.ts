import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { COMMISSION_PERCENT } from '@taxi/common';
import { PaymentMethod } from '@taxi/database';
import { EventBusService, EventType } from '@taxi/events';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { WalletService } from './wallet.service';
import { ClickProvider } from '../infrastructure/providers/click.provider';
import { PaymeProvider } from '../infrastructure/providers/payme.provider';
import { UzumProvider } from '../infrastructure/providers/uzum.provider';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly repo: PaymentRepository,
    private readonly wallet: WalletService,
    private readonly click: ClickProvider,
    private readonly payme: PaymeProvider,
    private readonly uzum: UzumProvider,
    private readonly eventBus: EventBusService,
  ) {}

  async processPayment(userId: string, tripId: string, method?: PaymentMethod) {
    const trip = await this.repo.getTrip(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.passenger_id !== userId) throw new BadRequestException('Not your trip');
    if (trip.status !== 'completed' && trip.status !== 'payment_processing') {
      throw new BadRequestException('Trip not ready for payment');
    }

    const amountUzs = Number(trip.final_price_uzs ?? trip.fixed_price_uzs);
    if (!amountUzs) throw new BadRequestException('No fare amount');

    const paymentMethod = method ?? trip.payment_method;
    const commissionUzs = Math.round(amountUzs * (COMMISSION_PERCENT / 100));

    const payment = await this.repo.createPayment({
      tripId,
      userId,
      amountUzs,
      method: paymentMethod,
      commissionUzs,
    });

    let result: { success: boolean; transactionId?: string; error?: string; paymentUrl?: string; pending?: boolean };

    switch (paymentMethod) {
      case PaymentMethod.CASH:
        result = { success: true, transactionId: `cash_${payment.id}` };
        break;
      case PaymentMethod.WALLET:
        result = (await this.wallet.debit(userId, amountUzs))
          ? { success: true, transactionId: `wallet_${payment.id}` }
          : { success: false, error: 'Insufficient wallet balance' };
        break;
      case PaymentMethod.CLICK:
        result = await this.click.createPayment(amountUzs, tripId, userId);
        break;
      case PaymentMethod.PAYME:
        result = await this.payme.createPayment(amountUzs, tripId);
        break;
      case PaymentMethod.UZUM:
        result = await this.uzum.createPayment(amountUzs, tripId);
        break;
      case PaymentMethod.CARD:
        result = { success: true, transactionId: `card_mock_${Date.now()}` };
        break;
      default:
        result = { success: false, error: 'Unsupported payment method' };
    }

    if (!result.success) {
      await this.repo.failPayment(payment.id, result.error ?? 'Payment failed');
      throw new BadRequestException({ message: result.error, error: 'PAYMENT_FAILED' });
    }

    if (result.pending && result.paymentUrl) {
      return {
        paymentId: payment.id,
        tripId,
        amountUzs,
        method: paymentMethod,
        status: 'pending',
        paymentUrl: result.paymentUrl,
        transactionId: result.transactionId,
      };
    }

    return this.finalizePayment(payment.id, trip, amountUzs, commissionUzs, paymentMethod, userId, result.transactionId);
  }

  async confirmExternalPayment(tripId: string, provider: string, transactionId: string) {
    const trip = await this.repo.getTrip(tripId);
    if (!trip) return;

    const payment = await this.repo.getPaymentByTrip(tripId);
    if (!payment || payment.status === 'completed') return;

    const amountUzs = Number(payment.amount_uzs);
    const commissionUzs = Number(payment.commission_uzs);

    await this.finalizePayment(
      payment.id,
      trip,
      amountUzs,
      commissionUzs,
      payment.method,
      payment.user_id,
      transactionId,
    );

    this.logger.log(`External payment confirmed: ${provider} ${transactionId}`);
  }

  private async finalizePayment(
    paymentId: string,
    trip: { driver_id: string | null; passenger_id: string },
    amountUzs: number,
    commissionUzs: number,
    paymentMethod: PaymentMethod,
    userId: string,
    transactionId?: string,
  ) {
    const completed = await this.repo.completePayment(paymentId, transactionId);
    await this.repo.updateTripPaid(completed.trip_id);

    if (trip.driver_id) {
      const driverUserId = await this.repo.getDriverUserId(trip.driver_id);
      if (driverUserId) {
        await this.wallet.creditDriverEarnings(driverUserId, amountUzs, commissionUzs);
      }
    }

    await this.eventBus.publish(EventType.PAYMENT_COMPLETED, {
      tripId: completed.trip_id,
      paymentId: completed.id,
      amountUzs,
      method: paymentMethod,
      userId,
    });

    return {
      paymentId: completed.id,
      tripId: completed.trip_id,
      amountUzs,
      commissionUzs,
      method: paymentMethod,
      status: 'completed',
      transactionId,
    };
  }

  async getHistory(userId: string) {
    const payments = await this.repo.getPaymentHistory(userId);
    return payments.map((p) => ({
      id: p.id,
      tripId: p.trip_id,
      amountUzs: Number(p.amount_uzs),
      method: p.method,
      status: p.status,
      createdAt: p.created_at,
    }));
  }
}
