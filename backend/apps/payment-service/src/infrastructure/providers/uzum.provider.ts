import { Injectable, Logger } from '@nestjs/common';
import { ProviderResult } from './click.provider';

@Injectable()
export class UzumProvider {
  private readonly logger = new Logger(UzumProvider.name);

  async createPayment(amountUzs: number, tripId: string): Promise<ProviderResult> {
    if (!process.env.UZUM_MERCHANT_ID || process.env.NODE_ENV === 'development') {
      this.logger.log(`Mock Uzum payment: ${amountUzs} UZS for trip ${tripId}`);
      return { success: true, transactionId: `uzum_mock_${Date.now()}` };
    }
    return { success: false, error: 'Uzum not configured' };
  }

  async verifyPayment(transactionId: string): Promise<ProviderResult> {
    if (process.env.NODE_ENV === 'development') {
      return { success: true, transactionId };
    }
    return { success: false, error: 'Uzum not configured' };
  }
}
