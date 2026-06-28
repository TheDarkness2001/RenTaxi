import { Injectable } from '@nestjs/common';
import { DocumentType } from '@taxi/database';
import { IdentityRepository } from '../infrastructure/identity.repository';
import { KycVerificationService } from './kyc-verification.service';

@Injectable()
export class IdentityService {
  constructor(
    private readonly identityRepo: IdentityRepository,
    private readonly kycService: KycVerificationService,
  ) {}

  async uploadDocument(
    userId: string,
    type: DocumentType,
    storageUrl: string,
  ): Promise<{ id: string; type: DocumentType }> {
    const doc = await this.identityRepo.saveDocument(userId, type, storageUrl);
    return { id: doc.id, type: doc.type };
  }

  async getStatus(userId: string) {
    const identity = await this.identityRepo.findByUserId(userId);
    const documents = await this.identityRepo.getUserDocuments(userId);

    const required = [
      DocumentType.PASSPORT_FRONT,
      DocumentType.PASSPORT_BACK,
      DocumentType.SELFIE,
    ];
    const uploaded = documents.map((d) => d.type);
    const missing = required.filter((r) => !uploaded.includes(r));

    return {
      verified: identity?.verification_status === 'verified',
      identityId: identity?.id ?? null,
      documentsUploaded: uploaded,
      documentsMissing: missing,
      canVerify: missing.length === 0 && !identity,
    };
  }

  async submitVerification(userId: string) {
    return this.kycService.verify(userId);
  }
}
