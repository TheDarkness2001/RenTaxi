import { Injectable, UnauthorizedException } from '@nestjs/common';
import { isValidUzbekPhone, normalizePhone } from '@taxi/common';
import { EventBusService, EventType } from '@taxi/events';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { UserRepository } from '../infrastructure/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly userRepo: UserRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async sendOtp(phone: string, locale = 'uz'): Promise<{ message: string }> {
    const normalized = normalizePhone(phone);
    if (!isValidUzbekPhone(normalized)) {
      throw new UnauthorizedException('Invalid Uzbek phone number');
    }
    await this.otpService.send(normalized);
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(
    phone: string,
    code: string,
    deviceId?: string,
    locale = 'uz',
  ) {
    const normalized = normalizePhone(phone);
    const valid = await this.otpService.verify(normalized, code);
    if (!valid) {
      throw new UnauthorizedException({ message: 'Invalid or expired OTP', error: 'AUTH_INVALID_OTP' });
    }

    let user = await this.userRepo.findByPhone(normalized);
    const isNewUser = !user;

    if (!user) {
      user = await this.userRepo.create(normalized, locale, deviceId);
      await this.eventBus.publish(EventType.USER_REGISTERED, {
        userId: user.id,
        phone: normalized,
      });
    }

    const tokens = await this.tokenService.generateTokenPair(user, deviceId);

    return {
      ...tokens,
      user: {
        id: user.id,
        phone: user.phone,
        status: user.status,
        roles: user.roles,
        identityId: user.identity_id,
        isNewUser,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    return this.tokenService.refresh(refreshToken);
  }

  async logout(refreshToken: string) {
    await this.tokenService.logout(refreshToken);
    return { message: 'Logged out' };
  }

  async getMe(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      phone: user.phone,
      status: user.status,
      roles: user.roles,
      identityId: user.identity_id,
      preferredLocale: user.preferred_locale,
    };
  }
}
