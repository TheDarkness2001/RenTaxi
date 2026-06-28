import { Injectable, Logger } from '@nestjs/common';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<{ sent: number; failed: number }> {
    if (!tokens.length) return { sent: 0, failed: 0 };

    if (!process.env.FIREBASE_PROJECT_ID || process.env.NODE_ENV === 'development') {
      for (const token of tokens) {
        this.logger.log(`[FCM Mock] → ${token.slice(0, 20)}... | ${payload.title}: ${payload.body}`);
      }
      return { sent: tokens.length, failed: 0 };
    }

    // TODO: Firebase Admin SDK integration
    // admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data })
    return { sent: 0, failed: tokens.length };
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    if (process.env.SMS_PROVIDER === 'mock' || process.env.NODE_ENV === 'development') {
      this.logger.log(`[SMS Mock] → ${phone}: ${message}`);
      return true;
    }
    return false;
  }
}
