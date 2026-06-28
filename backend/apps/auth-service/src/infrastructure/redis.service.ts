import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

type MemoryEntry = { value: string; expiresAt: number };

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private useMemory = false;
  private readonly memory = new Map<string, MemoryEntry>();

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: true,
    });

    this.client
      .connect()
      .then(() => this.logger.log('Redis connected'))
      .catch((err) => {
        this.logger.warn(`Redis unavailable, using in-memory store: ${err.message}`);
        this.useMemory = true;
        this.client?.disconnect();
        this.client = null;
      });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  private purgeExpired() {
    const now = Date.now();
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt <= now) this.memory.delete(key);
    }
  }

  private memorySet(key: string, value: string, ttlSeconds: number) {
    this.purgeExpired();
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  private memoryGet(key: string): string | null {
    this.purgeExpired();
    const entry = this.memory.get(key);
    if (!entry || entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  private markMemoryFallback(err: unknown) {
    this.logger.warn(`Redis op failed, falling back to memory: ${(err as Error).message}`);
    this.useMemory = true;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (this.useMemory || !this.client) {
      this.memorySet(key, value, ttlSeconds);
      return;
    }
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } catch (err) {
      this.markMemoryFallback(err);
      this.memorySet(key, value, ttlSeconds);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemory || !this.client) return this.memoryGet(key);
    try {
      return await this.client.get(key);
    } catch (err) {
      this.markMemoryFallback(err);
      return this.memoryGet(key);
    }
  }

  async del(key: string): Promise<void> {
    if (this.useMemory || !this.client) {
      this.memory.delete(key);
      return;
    }
    try {
      await this.client.del(key);
    } catch (err) {
      this.markMemoryFallback(err);
      this.memory.delete(key);
    }
  }

  async incr(key: string): Promise<number> {
    if (this.useMemory || !this.client) {
      const current = parseInt(this.memoryGet(key) || '0', 10) + 1;
      this.memorySet(key, String(current), 3600);
      return current;
    }
    try {
      return await this.client.incr(key);
    } catch (err) {
      this.markMemoryFallback(err);
      const current = parseInt(this.memoryGet(key) || '0', 10) + 1;
      this.memorySet(key, String(current), 3600);
      return current;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (this.useMemory || !this.client) {
      const val = this.memoryGet(key);
      if (val != null) this.memorySet(key, val, ttlSeconds);
      return;
    }
    try {
      await this.client.expire(key, ttlSeconds);
    } catch (err) {
      this.markMemoryFallback(err);
      const val = this.memoryGet(key);
      if (val != null) this.memorySet(key, val, ttlSeconds);
    }
  }
}
