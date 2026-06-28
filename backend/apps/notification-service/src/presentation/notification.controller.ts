import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { IsEnum, IsString } from 'class-validator';
import { NotificationService } from '../application/notification.service';

class RegisterDeviceDto {
  @IsString()
  token!: string;

  @IsEnum(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';
}

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('device')
  registerDevice(@Req() req: { user: { sub: string } }, @Body() dto: RegisterDeviceDto) {
    return this.notificationService.registerDevice(req.user.sub, dto.token, dto.platform);
  }

  @Get()
  list(@Req() req: { user: { sub: string } }) {
    return this.notificationService.getNotifications(req.user.sub);
  }

  @Patch(':id/read')
  markRead(@Req() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.notificationService.markRead(req.user.sub, id);
  }
}
