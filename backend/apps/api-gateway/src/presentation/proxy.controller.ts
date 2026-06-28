import {
  All,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { Public } from '@taxi/common';
import { ProxyService } from '../application/proxy.service';

@Controller()
export class ProxyController {
  constructor(private readonly proxy: ProxyService) {}

  @Public()
  @All('auth/*')
  async authProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Headers('authorization') auth?: string,
    @Res() res?: Response,
  ) {
    const path = req.url.replace('/v1/auth', '/auth');
    const result = await this.proxy.forward('auth', path, req.method, req.body, {
      ...(auth ? { Authorization: auth } : {}),
    });
    return res!.status(result.status).json(result.data);
  }

  @All('identity/*')
  async identityProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Headers('authorization') auth?: string,
    @Res() res?: Response,
  ) {
    const path = req.url.replace('/v1/identity', '/identity');
    const result = await this.proxy.forward('identity', path, req.method, req.body, {
      ...(auth ? { Authorization: auth } : {}),
    });
    return res!.status(result.status).json(result.data);
  }

  @All('rides/*')
  async ridesProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Headers('authorization') auth?: string,
    @Res() res?: Response,
  ) {
    const path = req.url.replace('/v1/rides', '/rides');
    const result = await this.proxy.forward('rides', path, req.method, req.body, {
      ...(auth ? { Authorization: auth } : {}),
    });
    return res!.status(result.status).json(result.data);
  }

  @Public()
  @All('payments/webhooks/*')
  async paymentWebhooksProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Res() res?: Response,
  ) {
    const path = req.url.replace('/v1/payments', '/payments');
    const result = await this.proxy.forward('payments', path, req.method, req.body);
    return res!.status(result.status).json(result.data);
  }

  @All('payments/*')
  async paymentsProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Headers('authorization') auth?: string,
    @Res() res?: Response,
  ) {
    const path = req.url.replace('/v1/payments', '/payments');
    const result = await this.proxy.forward('payments', path, req.method, req.body, {
      ...(auth ? { Authorization: auth } : {}),
    });
    return res!.status(result.status).json(result.data);
  }

  @All('location/*')
  async locationProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Headers('authorization') auth?: string,
    @Res() res?: Response,
  ) {
    const path = req.url.replace('/v1/location', '/location');
    const result = await this.proxy.forward('location', path, req.method, req.body, {
      ...(auth ? { Authorization: auth } : {}),
    });
    return res!.status(result.status).json(result.data);
  }

  @All('drivers/location')
  async driverLocationProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Headers('authorization') auth?: string,
    @Res() res?: Response,
  ) {
    const result = await this.proxy.forward('location', '/drivers/location', req.method, req.body, {
      ...(auth ? { Authorization: auth } : {}),
    });
    return res!.status(result.status).json(result.data);
  }

  @All('drivers/*')
  async driversProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Headers('authorization') auth?: string,
    @Res() res?: Response,
  ) {
    const path = req.url.replace('/v1/drivers', '/drivers');
    const result = await this.proxy.forward('rides', path, req.method, req.body, {
      ...(auth ? { Authorization: auth } : {}),
    });
    return res!.status(result.status).json(result.data);
  }

  @All('notifications/*')
  async notificationsProxy(
    @Req() req: { method: string; url: string; body: unknown },
    @Headers('authorization') auth?: string,
    @Res() res?: Response,
  ) {
    const path = req.url.replace('/v1/notifications', '/notifications');
    const result = await this.proxy.forward('notifications', path, req.method, req.body, {
      ...(auth ? { Authorization: auth } : {}),
    });
    return res!.status(result.status).json(result.data);
  }
}

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    };
  }
}
