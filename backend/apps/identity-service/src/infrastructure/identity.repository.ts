import { Injectable } from '@nestjs/common';
import { DatabaseService, DocumentType, VerificationStatus } from '@taxi/database';

interface IdentityRow {
  id: string;
  passport_number_hash: string;
  first_name: string;
  last_name: string;
  verification_status: VerificationStatus;
}

interface DocumentRow {
  id: string;
  user_id: string;
  identity_id: string | null;
  type: DocumentType;
  storage_url: string;
  ocr_data: Record<string, unknown> | null;
  liveness_score: number | null;
  face_match_score: number | null;
}

@Injectable()
export class IdentityRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByPassportHash(hash: string): Promise<IdentityRow | null> {
    const result = await this.db.query<IdentityRow>(
      'SELECT * FROM identities WHERE passport_number_hash = $1',
      [hash],
    );
    return result.rows[0] ?? null;
  }

  async findByFaceHash(hash: string): Promise<IdentityRow | null> {
    const result = await this.db.query<IdentityRow>(
      'SELECT * FROM identities WHERE face_embedding_hash = $1',
      [hash],
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: string): Promise<IdentityRow | null> {
    const result = await this.db.query<IdentityRow>(
      `SELECT i.* FROM identities i
       JOIN users u ON u.identity_id = i.id
       WHERE u.id = $1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async getUserDocuments(userId: string): Promise<DocumentRow[]> {
    const result = await this.db.query<DocumentRow>(
      'SELECT * FROM identity_documents WHERE user_id = $1 ORDER BY created_at',
      [userId],
    );
    return result.rows;
  }

  async saveDocument(
    userId: string,
    type: DocumentType,
    storageUrl: string,
    ocrData?: Record<string, unknown>,
  ): Promise<DocumentRow> {
    const result = await this.db.query<DocumentRow>(
      `INSERT INTO identity_documents (user_id, type, storage_url, ocr_data)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, type, storageUrl, ocrData ? JSON.stringify(ocrData) : null],
    );
    return result.rows[0];
  }

  async createIdentity(data: {
    passportHash: string;
    passportSeries: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    faceEmbeddingHash: string;
  }): Promise<IdentityRow> {
    const result = await this.db.query<IdentityRow>(
      `INSERT INTO identities (
        passport_number_hash, passport_series, first_name, last_name,
        date_of_birth, nationality, face_embedding_hash,
        verification_status, verified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'verified', NOW())
      RETURNING *`,
      [
        data.passportHash,
        data.passportSeries,
        data.firstName,
        data.lastName,
        data.dateOfBirth,
        data.nationality,
        data.faceEmbeddingHash,
      ],
    );
    return result.rows[0];
  }

  async linkUserToIdentity(userId: string, identityId: string): Promise<void> {
    await this.db.query(
      `UPDATE users SET identity_id = $1, status = 'active', updated_at = NOW()
       WHERE id = $2`,
      [identityId, userId],
    );
  }

  async updateDocumentScores(
    docId: string,
    livenessScore: number,
    faceMatchScore: number,
  ): Promise<void> {
    await this.db.query(
      `UPDATE identity_documents
       SET liveness_score = $1, face_match_score = $2
       WHERE id = $3`,
      [livenessScore, faceMatchScore, docId],
    );
  }
}
