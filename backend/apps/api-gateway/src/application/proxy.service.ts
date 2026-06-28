import { Injectable, Logger } from '@nestjs/common';
import { Public } from '@taxi/common';

const SERVICE_URLS: Record<string, string> = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3002',
  rides: process.env.RIDE_SERVICE_URL || 'http://localhost:3003',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
  location: process.env.LOCATION_SERVICE_URL || 'http://localhost:3005',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
};

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  async forward(
    service: keyof typeof SERVICE_URLS,
    path: string,
    method: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<{ status: number; data: unknown }> {
    const baseUrl = SERVICE_URLS[service];
    const url = `${baseUrl}/v1${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => null);
      return { status: response.status, data };
    } catch (error) {
      this.logger.error(`Proxy failed: ${service}${path}`, error);
      throw error;
    }
  }
}
