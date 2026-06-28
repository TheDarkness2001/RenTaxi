import { Body, Controller, Get, Headers, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '@taxi/common';
import { ClickProvider } from '../infrastructure/providers/click.provider';
import { PaymeProvider } from '../infrastructure/providers/payme.provider';
import { PaymentService } from '../application/payment.service';

@Controller('payments/webhooks')
export class PaymentWebhookController {
  constructor(
    private readonly click: ClickProvider,
    private readonly payme: PaymeProvider,
    private readonly paymentService: PaymentService,
  ) {}

  @Public()
  @Post('click')
  async clickWebhook(@Body() body: Record<string, string>, @Res() res: Response) {
    if (!this.click.verifyWebhookSignature(body)) {
      return res.status(403).json({ error: -1, error_note: 'Invalid signature' });
    }

    if (body.action === '1' && body.error === '0') {
      const tripId = body.merchant_trans_id?.split('_')[0];
      if (tripId) {
        await this.paymentService.confirmExternalPayment(tripId, 'click', body.click_trans_id);
      }
    }

    return res.json({ error: 0, error_note: 'Success' });
  }

  @Public()
  @Post('payme')
  async paymeWebhook(
    @Body() body: { method: string; params: Record<string, unknown> },
    @Headers('authorization') auth: string,
    @Res() res: Response,
  ) {
    if (!this.payme.verifyAuthorization(auth)) {
      return res.status(403).json({ error: { code: -32504, message: 'Unauthorized' } });
    }

    // Payme merchant API handles Check/Create/Perform via this endpoint
    return res.json({
      jsonrpc: '2.0',
      id: Date.now(),
      result: { allow: true },
    });
  }
}
