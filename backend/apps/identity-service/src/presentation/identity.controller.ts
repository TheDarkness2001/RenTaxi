import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { IsEnum, IsString, IsUrl } from 'class-validator';
import { RequireKyc } from '@taxi/common';
import { DocumentType } from '@taxi/database';
import { IdentityService } from '../application/identity.service';

class UploadDocumentDto {
  @IsEnum(DocumentType)
  type!: DocumentType;

  @IsUrl()
  storageUrl!: string;
}

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post('documents')
  uploadDocument(@Req() req: { user: { sub: string } }, @Body() dto: UploadDocumentDto) {
    return this.identityService.uploadDocument(req.user.sub, dto.type, dto.storageUrl);
  }

  @Get('status')
  getStatus(@Req() req: { user: { sub: string } }) {
    return this.identityService.getStatus(req.user.sub);
  }

  @Post('verify')
  submitVerification(@Req() req: { user: { sub: string } }) {
    return this.identityService.submitVerification(req.user.sub);
  }
}
