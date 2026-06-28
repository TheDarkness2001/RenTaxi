import { Injectable, Logger } from '@nestjs/common';
import { generateOtp } from '@taxi/common';
import { RedisService } from '../infrastructure/redis.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly expirySeconds = parseInt(process.env.OTP_EXPIRY_SECONDS || '300', 10);

  constructor(private readonly redis: RedisService) {}

  async send(phone: string): Promise<void> {
    const rateLimitKey = `otp:rate:${phone}`;
    const attempts = await this.redis.incr(rateLimitKey);
    if (attempts === 1) await this.redis.expire(rateLimitKey, 3600);
    if (attempts > 5) throw new Error('Too many OTP requests');

    const useMockOtp =
      process.env.SMS_PROVIDER === 'mock' || process.env.NODE_ENV === 'development';
    const code = useMockOtp ? '123456' : generateOtp(6);
    await this.redis.set(`otp:${phone}`, code, this.expirySeconds);

    if (useMockOtp) {
      this.logger.log(`OTP for ${phone}: ${code}`);
    } else {
      // TODO: integrate SMS provider (Playmobile, Eskiz.uz)
    }
  }

  async verify(phone: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(`otp:${phone}`);
    if (!stored || stored !== code) return false;
    await this.redis.del(`otp:${phone}`);
    return true;
  }
}
