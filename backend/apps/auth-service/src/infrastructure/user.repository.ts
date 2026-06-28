import { Injectable } from '@nestjs/common';
import { DatabaseService, UserStatus } from '@taxi/database';

interface UserRow {
  id: string;
  phone: string;
  identity_id: string | null;
  roles: string[];
  status: UserStatus;
  preferred_locale: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UserRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByPhone(phone: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      'SELECT * FROM users WHERE phone = $1',
      [phone],
    );
    return result.rows[0] ?? null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  }

  async create(phone: string, locale: string, deviceId?: string): Promise<UserRow> {
    const result = await this.db.query<UserRow>(
      `INSERT INTO users (phone, preferred_locale, device_fingerprint)
       VALUES ($1, $2, $3) RETURNING *`,
      [phone, locale, deviceId ?? null],
    );
    return result.rows[0];
  }

  async activateUser(userId: string, identityId: string): Promise<void> {
    await this.db.query(
      `UPDATE users SET identity_id = $1, status = 'active', updated_at = NOW()
       WHERE id = $2`,
      [identityId, userId],
    );
  }

  async saveRefreshToken(
    userId: string,
    tokenHash: string,
    deviceId: string | undefined,
    expiresAt: Date,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, device_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userId, tokenHash, deviceId ?? null, expiresAt],
    );
  }

  async findRefreshToken(tokenHash: string): Promise<{ user_id: string } | null> {
    const result = await this.db.query<{ user_id: string }>(
      `SELECT user_id FROM refresh_tokens
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
  }
}
