import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { hashValue, KYC } from '@taxi/common';
import { DocumentType } from '@taxi/database';
import { EventBusService, EventType } from '@taxi/events';
import { IdentityRepository } from '../infrastructure/identity.repository';
import { OcrService } from '../infrastructure/ocr.service';
import { FaceMatchService } from '../infrastructure/face-match.service';

@Injectable()
export class KycVerificationService {
  private readonly logger = new Logger(KycVerificationService.name);

  constructor(
    private readonly identityRepo: IdentityRepository,
    private readonly ocrService: OcrService,
    private readonly faceMatchService: FaceMatchService,
    private readonly eventBus: EventBusService,
  ) {}

  async verify(userId: string): Promise<{ identityId: string; status: string }> {
    const documents = await this.identityRepo.getUserDocuments(userId);

    const passportFront = documents.find((d) => d.type === DocumentType.PASSPORT_FRONT);
    const passportBack = documents.find((d) => d.type === DocumentType.PASSPORT_BACK);
    const selfie = documents.find((d) => d.type === DocumentType.SELFIE);

    if (!passportFront || !passportBack || !selfie) {
      throw new BadRequestException(
        'All documents required: passport_front, passport_back, selfie',
      );
    }

    const ocrFront = await this.ocrService.extractPassportData(passportFront.storage_url, 'front');
    if (!ocrFront) throw new BadRequestException('Failed to extract passport data');

    const passportHash = hashValue(ocrFront.passportNumber);

    const existingPassport = await this.identityRepo.findByPassportHash(passportHash);
    if (existingPassport) {
      throw new ConflictException({
        message: 'This passport is already registered to another account',
        error: 'IDENTITY_DUPLICATE_PASSPORT',
      });
    }

    const liveness = await this.faceMatchService.checkLiveness(selfie.storage_url);
    if (!liveness.isLive || liveness.spoofDetected) {
      throw new ForbiddenException('Liveness check failed — possible spoofing detected');
    }
    if (liveness.score < this.faceMatchService.getLivenessThreshold()) {
      throw new ForbiddenException('Liveness score below threshold');
    }

    const faceMatch = await this.faceMatchService.matchFaces(
      selfie.storage_url,
      passportFront.storage_url,
    );
    if (!faceMatch.isMatch || faceMatch.score < this.faceMatchService.getMatchThreshold()) {
      throw new ForbiddenException('Face does not match passport photo');
    }

    const faceEmbeddingHash = await this.faceMatchService.generateFaceEmbedding(selfie.storage_url);
    const existingFace = await this.identityRepo.findByFaceHash(faceEmbeddingHash);
    if (existingFace) {
      throw new ConflictException({
        message: 'This face is already registered to another account',
        error: 'IDENTITY_DUPLICATE_FACE',
      });
    }

    const identity = await this.identityRepo.createIdentity({
      passportHash,
      passportSeries: ocrFront.passportSeries,
      firstName: ocrFront.firstName,
      lastName: ocrFront.lastName,
      dateOfBirth: ocrFront.dateOfBirth,
      nationality: ocrFront.nationality,
      faceEmbeddingHash,
    });

    await this.identityRepo.linkUserToIdentity(userId, identity.id);
    await this.identityRepo.updateDocumentScores(selfie.id, liveness.score, faceMatch.score);

    await this.eventBus.publish(EventType.IDENTITY_VERIFIED, {
      userId,
      identityId: identity.id,
    });

    this.logger.log(`Identity verified for user ${userId}: ${identity.id}`);

    return { identityId: identity.id, status: 'verified' };
  }
}
