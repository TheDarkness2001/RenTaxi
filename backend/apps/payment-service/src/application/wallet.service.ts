import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentRepository } from '../infrastructure/payment.repository';

@Injectable()
export class WalletService {
  constructor(private readonly repo: PaymentRepository) {}

  async getBalance(userId: string) {
    const passenger = await this.repo.ensureWallet(userId, 'passenger');
    const driver = await this.repo.getWallet(userId, 'driver_earnings');
    return {
      passenger: { balanceUzs: Number(passenger.balance_uzs) },
      driverEarnings: { balanceUzs: Number(driver?.balance_uzs ?? 0) },
      currency: 'UZS' as const,
    };
  }

  async topUp(userId: string, amountUzs: number) {
    if (amountUzs < 1000) throw new BadRequestException('Minimum top-up is 1,000 UZS');
    const wallet = await this.repo.creditWallet(userId, 'passenger', amountUzs);
    return { balanceUzs: Number(wallet.balance_uzs), currency: 'UZS' };
  }

  async debit(userId: string, amountUzs: number): Promise<boolean> {
    const result = await this.repo.debitWallet(userId, 'passenger', amountUzs);
    return result !== null;
  }

  async creditDriverEarnings(driverUserId: string, amountUzs: number, commissionUzs: number) {
    const net = amountUzs - commissionUzs;
    await this.repo.creditWallet(driverUserId, 'driver_earnings', net);
    return { creditedUzs: net, commissionUzs };
  }
}
