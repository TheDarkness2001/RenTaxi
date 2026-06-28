import { Injectable, Logger } from '@nestjs/common';
import { hashValue } from '@taxi/common';
import { DocumentType } from '@taxi/database';

export interface OcrResult {
  passportNumber: string;
  passportSeries: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  photoRegion?: { x: number; y: number; width: number; height: number };
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractPassportData(imageUrl: string, side: 'front' | 'back'): Promise<OcrResult | null> {
    if (process.env.KYC_OCR_PROVIDER === 'mock') {
      this.logger.log(`Mock OCR for ${side}: ${imageUrl}`);
      const suffix = hashValue(imageUrl).slice(0, 7).toUpperCase();
      return {
        passportNumber: `AA${suffix}`,
        passportSeries: 'AA',
        firstName: 'JAHONGIR',
        lastName: 'KARIMOV',
        dateOfBirth: '1995-06-15',
        nationality: 'UZB',
        photoRegion: { x: 10, y: 50, width: 100, height: 120 },
      };
    }
    return null;
  }
}
