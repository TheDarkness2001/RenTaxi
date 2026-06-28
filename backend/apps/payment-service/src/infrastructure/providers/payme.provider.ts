import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ProviderResult } from './click.provider';

interface PaymeRpcResponse {
  jsonrpc: string;
  id: number;
  result?: { allow?: boolean; transaction?: string; state?: number; receipt?: { _id: string } };
  error?: { code: number; message: string };
}

@Injectable()
export class PaymeProvider {
  private readonly logger = new Logger(PaymeProvider.name);
  private readonly apiUrl = process.env.PAYME_API_URL || 'https://checkout.paycom.uz/api';

  private isConfigured(): boolean {
    return !!(process.env.PAYME_MERCHANT_ID && process.env.PAYME_SECRET_KEY);
  }

  private authHeader(): string {
    const key = `Paycom:${process.env.PAYME_SECRET_KEY!}`;
    return `Basic ${Buffer.from(key).toString('base64')}`;
  }

  private async rpc(method: string, params: Record<string, unknown>): Promise<PaymeRpcResponse> {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authHeader(),
      },
      body: JSON.stringify({ method, params, id: Date.now() }),
    });
    return response.json() as Promise<PaymeRpcResponse>;
  }

  async createPayment(amountUzs: number, tripId: string): Promise<ProviderResult> {
    if (!this.isConfigured() || process.env.PAYMENT_MOCK === 'true') {
      this.logger.log(`Mock Payme: ${amountUzs} UZS trip=${tripId}`);
      return { success: true, transactionId: `payme_mock_${Date.now()}`, pending: false };
    }

    try {
      const amountTiyin = amountUzs * 100;
      const account = { trip_id: tripId };
      const check = await this.rpc('CheckPerformTransaction', { amount: amountTiyin, account });

      if (check.error || !check.result?.allow) {
        return { success: false, error: check.error?.message || 'Payme check failed' };
      }

      const create = await this.rpc('CreateTransaction', {
        id: `${tripId}_${Date.now()}`,
        time: Date.now(),
        amount: amountTiyin,
        account,
      });

      if (create.error) {
        return { success: false, error: create.error.message };
      }

      const merchantId = process.env.PAYME_MERCHANT_ID!;
      const paymentUrl = `https://checkout.paycom.uz/${Buffer.from(
        `${merchantId};${amountTiyin};${tripId}`,
      ).toString('base64')}`;

      return {
        success: true,
        pending: true,
        transactionId: create.result?.transaction,
        paymentUrl,
      };
    } catch (error) {
      this.logger.error('Payme API error', error);
      return { success: false, error: 'Payme service unavailable' };
    }
  }

  async verifyPayment(transactionId: string): Promise<ProviderResult> {
    if (!this.isConfigured() || process.env.PAYMENT_MOCK === 'true') {
      return { success: true, transactionId };
    }

    try {
      const result = await this.rpc('PerformTransaction', { id: transactionId });
      if (result.error) return { success: false, error: result.error.message };
      return { success: true, transactionId };
    } catch {
      return { success: false, error: 'Payme verification failed' };
    }
  }

  verifyAuthorization(authHeader: string): boolean {
    const expected = this.authHeader();
    return authHeader === expected;
  }
}
