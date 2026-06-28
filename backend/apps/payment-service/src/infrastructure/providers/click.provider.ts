import { createHash } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';

export interface ProviderResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
  pending?: boolean;
}

@Injectable()
export class ClickProvider {
  private readonly logger = new Logger(ClickProvider.name);
  private readonly apiUrl = process.env.CLICK_API_URL || 'https://api.click.uz/v2/merchant';

  private isConfigured(): boolean {
    return !!(process.env.CLICK_MERCHANT_ID && process.env.CLICK_SERVICE_ID && process.env.CLICK_SECRET_KEY);
  }

  private authHeader(): string {
    const userId = process.env.CLICK_MERCHANT_USER_ID || process.env.CLICK_MERCHANT_ID!;
    const secret = process.env.CLICK_SECRET_KEY!;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const digest = createHash('sha1').update(timestamp + secret).digest('hex');
    return `${userId}:${digest}:${timestamp}`;
  }

  async createPayment(amountUzs: number, tripId: string, userId: string): Promise<ProviderResult> {
    if (!this.isConfigured() || process.env.PAYMENT_MOCK === 'true') {
      this.logger.log(`Mock Click: ${amountUzs} UZS trip=${tripId}`);
      return { success: true, transactionId: `click_mock_${Date.now()}`, pending: false };
    }

    try {
      const merchantTransId = `${tripId}_${Date.now()}`;
      const response = await fetch(`${this.apiUrl}/invoice/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Auth: this.authHeader(),
          Accept: 'application/json',
        },
        body: JSON.stringify({
          service_id: Number(process.env.CLICK_SERVICE_ID),
          amount: amountUzs,
          phone_number: userId,
          merchant_trans_id: merchantTransId,
        }),
      });

      const data = (await response.json()) as {
        error_code?: number;
        error_note?: string;
        invoice_id?: number;
        payment_url?: string;
      };

      if (data.error_code !== 0) {
        return { success: false, error: data.error_note || 'Click payment failed' };
      }

      return {
        success: true,
        pending: true,
        transactionId: String(data.invoice_id),
        paymentUrl: data.payment_url,
      };
    } catch (error) {
      this.logger.error('Click API error', error);
      return { success: false, error: 'Click service unavailable' };
    }
  }

  async verifyPayment(invoiceId: string): Promise<ProviderResult> {
    if (!this.isConfigured() || process.env.PAYMENT_MOCK === 'true') {
      return { success: true, transactionId: invoiceId };
    }

    try {
      const response = await fetch(`${this.apiUrl}/payment/status/${invoiceId}`, {
        headers: { Auth: this.authHeader(), Accept: 'application/json' },
      });
      const data = (await response.json()) as { error_code?: number; payment_status?: number };
      // payment_status 2 = paid
      if (data.error_code === 0 && data.payment_status === 2) {
        return { success: true, transactionId: invoiceId };
      }
      return { success: false, error: 'Payment not completed' };
    } catch {
      return { success: false, error: 'Click verification failed' };
    }
  }

  verifyWebhookSignature(params: Record<string, string>): boolean {
    const secret = process.env.CLICK_SECRET_KEY!;
    const signString = [
      params.click_trans_id,
      params.service_id,
      secret,
      params.merchant_trans_id,
      params.amount,
      params.action,
      params.sign_time,
    ].join('');
    const expected = createHash('md5').update(signString).digest('hex');
    return expected === params.sign_string;
  }
}
