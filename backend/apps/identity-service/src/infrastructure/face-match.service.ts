import { Injectable, Logger } from '@nestjs/common';

export interface FaceMatchResult {
  score: number;
  isMatch: boolean;
}

export interface LivenessResult {
  score: number;
  isLive: boolean;
  spoofDetected: boolean;
}

@Injectable()
export class FaceMatchService {
  private readonly logger = new Logger(FaceMatchService.name);
  private readonly matchThreshold = parseFloat(process.env.KYC_FACE_MATCH_THRESHOLD || '0.85');
  private readonly livenessThreshold = parseFloat(process.env.KYC_LIVENESS_THRESHOLD || '0.90');

  async matchFaces(selfieUrl: string, passportPhotoUrl: string): Promise<FaceMatchResult> {
    if (process.env.KYC_OCR_PROVIDER === 'mock') {
      return { score: 0.95, isMatch: true };
    }
    return { score: 0, isMatch: false };
  }

  async checkLiveness(selfieUrl: string): Promise<LivenessResult> {
    if (process.env.KYC_OCR_PROVIDER === 'mock') {
      return { score: 0.98, isLive: true, spoofDetected: false };
    }
    return { score: 0, isLive: false, spoofDetected: true };
  }

  async generateFaceEmbedding(imageUrl: string): Promise<string> {
    if (process.env.KYC_OCR_PROVIDER === 'mock') {
      return 'mock_face_embedding_hash_' + imageUrl.slice(-8);
    }
    return '';
  }

  getMatchThreshold(): number {
    return this.matchThreshold;
  }

  getLivenessThreshold(): number {
    return this.livenessThreshold;
  }
}
