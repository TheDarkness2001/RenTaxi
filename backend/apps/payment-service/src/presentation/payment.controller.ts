import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { RequireKyc } from '@taxi/common';
import { PaymentMethod } from '@taxi/database';
import { PaymentService } from '../application/payment.service';
import { WalletService } from '../application/wallet.service';
import { RefundService } from '../application/refund.service';

class ProcessPaymentDto {
  @IsUUID()
  tripId!: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;
}

class TopUpDto {
  @IsNumber()
  @Min(1000)
  amountUzs!: number;
}

class RefundDto {
  @IsUUID()
  tripId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller('payments')
@RequireKyc()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly walletService: WalletService,
    private readonly refundService: RefundService,
  ) {}

  @Post('process')
  process(@Req() req: { user: { sub: string } }, @Body() dto: ProcessPaymentDto) {
    return this.paymentService.processPayment(req.user.sub, dto.tripId, dto.method);
  }

  @Get('wallet')
  getWallet(@Req() req: { user: { sub: string } }) {
    return this.walletService.getBalance(req.user.sub);
  }

  @Post('wallet/topup')
  topUp(@Req() req: { user: { sub: string } }, @Body() dto: TopUpDto) {
    return this.walletService.topUp(req.user.sub, dto.amountUzs);
  }

  @Post('refund')
  refund(@Req() req: { user: { sub: string } }, @Body() dto: RefundDto) {
    return this.refundService.requestRefund(req.user.sub, dto.tripId, dto.reason);
  }

  @Get('history')
  history(@Req() req: { user: { sub: string } }) {
    return this.paymentService.getHistory(req.user.sub);
  }
}
