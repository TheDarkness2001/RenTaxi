import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../infrastructure/notification.repository';
import { PushService } from '../infrastructure/push.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly push: PushService,
  ) {}

  async registerDevice(userId: string, token: string, platform: 'ios' | 'android' | 'web') {
    const device = await this.repo.registerToken(userId, token, platform);
    return { registered: true, platform: device.platform };
  }

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>,
  ) {
    await this.repo.saveNotification(userId, title, body, type, data);
    const tokens = await this.repo.getActiveTokens(userId);
    const result = await this.push.sendToTokens(
      tokens.map((t) => t.token),
      {
        title,
        body,
        data: data
          ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)]))
          : undefined,
      },
    );
    return { delivered: result.sent, failed: result.failed };
  }

  async getNotifications(userId: string) {
    const notifications = await this.repo.getUserNotifications(userId);
    return notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data,
      sentAt: n.sent_at,
      readAt: n.read_at,
    }));
  }

  async markRead(userId: string, notificationId: string) {
    await this.repo.markRead(notificationId, userId);
    return { read: true };
  }
}
