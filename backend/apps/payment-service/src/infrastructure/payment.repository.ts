import { Injectable } from '@nestjs/common';
import { DatabaseService, PaymentMethod } from '@taxi/database';

interface PaymentRow {
  id: string;
  trip_id: string;
  user_id: string;
  amount_uzs: number;
  method: PaymentMethod;
  status: string;
  provider_transaction_id: string | null;
  commission_uzs: number;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

interface WalletRow {
  id: string;
  user_id: string;
  balance_uzs: number;
  type: string;
}

interface TripRow {
  id: string;
  passenger_id: string;
  driver_id: string | null;
  final_price_uzs: number | null;
  fixed_price_uzs: number | null;
  payment_method: PaymentMethod;
  status: string;
}

@Injectable()
export class PaymentRepository {
  constructor(private readonly db: DatabaseService) {}

  async getTrip(tripId: string): Promise<TripRow | null> {
    const result = await this.db.query<TripRow>('SELECT * FROM trips WHERE id = $1', [tripId]);
    return result.rows[0] ?? null;
  }

  async createPayment(data: {
    tripId: string;
    userId: string;
    amountUzs: number;
    method: PaymentMethod;
    commissionUzs: number;
    providerTransactionId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<PaymentRow> {
    const result = await this.db.query<PaymentRow>(
      `INSERT INTO payments (trip_id, user_id, amount_uzs, method, status, commission_uzs, provider_transaction_id, metadata)
       VALUES ($1, $2, $3, $4, 'processing', $5, $6, $7) RETURNING *`,
      [
        data.tripId,
        data.userId,
        data.amountUzs,
        data.method,
        data.commissionUzs,
        data.providerTransactionId ?? null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );
    return result.rows[0];
  }

  async completePayment(paymentId: string, providerTransactionId?: string): Promise<PaymentRow> {
    const result = await this.db.query<PaymentRow>(
      `UPDATE payments SET status = 'completed', provider_transaction_id = COALESCE($2, provider_transaction_id), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [paymentId, providerTransactionId ?? null],
    );
    return result.rows[0];
  }

  async failPayment(paymentId: string, reason: string): Promise<void> {
    await this.db.query(
      `UPDATE payments SET status = 'failed', metadata = jsonb_build_object('reason', $2), updated_at = NOW() WHERE id = $1`,
      [paymentId, reason],
    );
  }

  async getWallet(userId: string, type: string): Promise<WalletRow | null> {
    const result = await this.db.query<WalletRow>(
      'SELECT * FROM wallets WHERE user_id = $1 AND type = $2',
      [userId, type],
    );
    return result.rows[0] ?? null;
  }

  async ensureWallet(userId: string, type: string): Promise<WalletRow> {
    let wallet = await this.getWallet(userId, type);
    if (!wallet) {
      const result = await this.db.query<WalletRow>(
        `INSERT INTO wallets (user_id, type) VALUES ($1, $2) RETURNING *`,
        [userId, type],
      );
      wallet = result.rows[0];
    }
    return wallet!;
  }

  async creditWallet(userId: string, type: string, amountUzs: number): Promise<WalletRow> {
    await this.ensureWallet(userId, type);
    const result = await this.db.query<WalletRow>(
      `UPDATE wallets SET balance_uzs = balance_uzs + $3, updated_at = NOW()
       WHERE user_id = $1 AND type = $2 RETURNING *`,
      [userId, type, amountUzs],
    );
    return result.rows[0];
  }

  async debitWallet(userId: string, type: string, amountUzs: number): Promise<WalletRow | null> {
    const wallet = await this.getWallet(userId, type);
    if (!wallet || wallet.balance_uzs < amountUzs) return null;
    const result = await this.db.query<WalletRow>(
      `UPDATE wallets SET balance_uzs = balance_uzs - $3, updated_at = NOW()
       WHERE user_id = $1 AND type = $2 RETURNING *`,
      [userId, type, amountUzs],
    );
    return result.rows[0];
  }

  async getPaymentHistory(userId: string, limit = 20): Promise<PaymentRow[]> {
    const result = await this.db.query<PaymentRow>(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    return result.rows;
  }

  async getPaymentByTrip(tripId: string): Promise<PaymentRow | null> {
    const result = await this.db.query<PaymentRow>(
      'SELECT * FROM payments WHERE trip_id = $1 ORDER BY created_at DESC LIMIT 1',
      [tripId],
    );
    return result.rows[0] ?? null;
  }

  async refundPayment(paymentId: string): Promise<PaymentRow> {
    const result = await this.db.query<PaymentRow>(
      `UPDATE payments SET status = 'refunded', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [paymentId],
    );
    return result.rows[0];
  }

  async updateTripPaid(tripId: string): Promise<void> {
    await this.db.query(
      `UPDATE trips SET status = 'paid', updated_at = NOW() WHERE id = $1`,
      [tripId],
    );
  }

  async getDriverUserId(driverId: string): Promise<string | null> {
    const result = await this.db.query<{ user_id: string }>(
      'SELECT user_id FROM drivers WHERE id = $1',
      [driverId],
    );
    return result.rows[0]?.user_id ?? null;
  }
}
