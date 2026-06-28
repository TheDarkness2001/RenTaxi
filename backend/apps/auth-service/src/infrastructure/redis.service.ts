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

  private async run<T>(redisFn: () => Promise<T>, memoryFn: () => T | Promise<T>): Promise<T> {
    if (this.useMemory || !this.client) return memoryFn();
    try {
      return await redisFn();
    } catch (err) {
      this.logger.warn(`Redis op failed, falling back to memory: ${(err as Error).message}`);
      this.useMemory = true;
      return memoryFn();
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.run(
      () => this.client!.set(key, value, 'EX', ttlSeconds),
      () => { this.memorySet(key, value, ttlSeconds); },
    );
  }

  async get(key: string): Promise<string | null> {
    return this.run(
      () => this.client!.get(key),
      () => this.memoryGet(key),
    );
  }

  async del(key: string): Promise<void> {
    await this.run(
      () => this.client!.del(key).then(() => undefined),
      () => { this.memory.delete(key); },
    );
  }

  async incr(key: string): Promise<number> {
    return this.run(
      () => this.client!.incr(key),
      () => {
        const current = parseInt(this.memoryGet(key) || '0', 10) + 1;
        this.memorySet(key, String(current), 3600);
        return current;
      },
    );
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.run(
      () => this.client!.expire(key, ttlSeconds).then(() => undefined),
      () => {
        const val = this.memoryGet(key);
        if (val != null) this.memorySet(key, val, ttlSeconds);
      },
    );
  }
}
