import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { IsString, Length, IsOptional, Matches } from 'class-validator';
import { Public } from '@taxi/common';
import { AuthService } from '../application/auth.service';

class SendOtpDto {
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/)
  phone!: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

class VerifyOtpDto {
  @IsString()
  phone!: string;

  @IsString()
  @Length(6, 6)
  code!: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

class RefreshDto {
  @IsString()
  refreshToken!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/send')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone, dto.locale);
  }

  @Public()
  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code, dto.deviceId);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  getMe(@Req() req: { user: { sub: string } }) {
    return this.authService.getMe(req.user.sub);
  }
}
