import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentRepository } from '../infrastructure/payment.repository';
import { WalletService } from './wallet.service';
import { EventBusService, EventType } from '@taxi/events';

@Injectable()
export class RefundService {
  constructor(
    private readonly repo: PaymentRepository,
    private readonly wallet: WalletService,
    private readonly eventBus: EventBusService,
  ) {}

  async requestRefund(userId: string, tripId: string, reason?: string) {
    const payment = await this.repo.getPaymentByTrip(tripId);
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.user_id !== userId) throw new BadRequestException('Not your payment');
    if (payment.status !== 'completed') throw new BadRequestException('Payment not refundable');

    const refunded = await this.repo.refundPayment(payment.id);

    if (payment.method === 'wallet') {
      await this.repo.creditWallet(userId, 'passenger', Number(payment.amount_uzs));
    }

    return {
      paymentId: refunded.id,
      tripId,
      amountUzs: Number(refunded.amount_uzs),
      status: 'refunded',
      reason,
    };
  }
}
