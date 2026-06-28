import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@taxi/database';

interface DeviceTokenRow {
  id: string;
  user_id: string;
  token: string;
  platform: string;
}

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown> | null;
  sent_at: Date;
  read_at: Date | null;
}

@Injectable()
export class NotificationRepository {
  constructor(private readonly db: DatabaseService) {}

  async registerToken(userId: string, token: string, platform: string): Promise<DeviceTokenRow> {
    const result = await this.db.query<DeviceTokenRow>(
      `INSERT INTO device_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token) DO UPDATE SET is_active = TRUE, updated_at = NOW()
       RETURNING *`,
      [userId, token, platform],
    );
    return result.rows[0];
  }

  async getActiveTokens(userId: string): Promise<DeviceTokenRow[]> {
    const result = await this.db.query<DeviceTokenRow>(
      'SELECT * FROM device_tokens WHERE user_id = $1 AND is_active = TRUE',
      [userId],
    );
    return result.rows;
  }

  async saveNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ): Promise<NotificationRow> {
    const result = await this.db.query<NotificationRow>(
      `INSERT INTO notifications (user_id, title, body, type, data)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, title, body, type, data ? JSON.stringify(data) : null],
    );
    return result.rows[0];
  }

  async getUserNotifications(userId: string, limit = 30): Promise<NotificationRow[]> {
    const result = await this.db.query<NotificationRow>(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY sent_at DESC LIMIT $2',
      [userId, limit],
    );
    return result.rows;
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.db.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
      [notificationId, userId],
    );
  }

  async getDriverUserId(driverId: string): Promise<string | null> {
    const result = await this.db.query<{ user_id: string }>(
      'SELECT user_id FROM drivers WHERE id = $1',
      [driverId],
    );
    return result.rows[0]?.user_id ?? null;
  }
}
