import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { hashValue } from '@taxi/common';
import { JwtPayload, UserStatus } from '@taxi/database';
import { UserRepository } from '../infrastructure/user.repository';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepo: UserRepository,
  ) {}

  async generateTokenPair(user: {
    id: string;
    phone: string;
    roles: string[];
    status: UserStatus;
    identity_id: string | null;
  }, deviceId?: string) {
    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      roles: user.roles,
      status: user.status,
      identityId: user.identity_id,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = randomBytes(32).toString('hex');
    const refreshHash = hashValue(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.userRepo.saveRefreshToken(user.id, refreshHash, deviceId, expiresAt);

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashValue(refreshToken);
    const record = await this.userRepo.findRefreshToken(tokenHash);
    if (!record) throw new Error('Invalid refresh token');

    const user = await this.userRepo.findById(record.user_id);
    if (!user) throw new Error('User not found');

    await this.userRepo.revokeRefreshToken(tokenHash);
    return this.generateTokenPair(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.userRepo.revokeRefreshToken(hashValue(refreshToken));
  }
}
