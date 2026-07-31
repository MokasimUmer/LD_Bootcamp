import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

export interface LeaderboardEntry {
  developerId: string;
  name: string;
  email: string;
  lightningAddress?: string;
  score: number;
  rank: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private inMemoryLeaderboards = new Map<string, Map<string, number>>();

  async onModuleInit() {
    try {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = Number(process.env.REDIS_PORT) || 6379;
      this.client = new Redis({
        host,
        port,
        retryStrategy: () => null, // Don't crash if local Redis is absent; fallback to in-memory
        lazyConnect: true,
      });

      await this.client.connect();
      this.logger.log(`Connected to Redis at ${host}:${port}`);
    } catch (err) {
      this.logger.warn(`Redis connection failed. Using in-memory fallback for leaderboards.`);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Add or update score in Redis Sorted Set: ZADD leaderboard:<bootcampId>:<dayNumber> <score> <developerId>
   */
  async updateScore(bootcampId: string, dayNumber: number, developerId: string, score: number): Promise<void> {
    const key = `leaderboard:${bootcampId}:${dayNumber}`;

    if (this.client) {
      try {
        await this.client.zadd(key, score, developerId);
        return;
      } catch (err) {
        this.logger.error(`Redis ZADD failed: ${err.message}`);
      }
    }

    // In-memory fallback
    if (!this.inMemoryLeaderboards.has(key)) {
      this.inMemoryLeaderboards.set(key, new Map());
    }
    this.inMemoryLeaderboards.get(key)!.set(developerId, score);
  }

  /**
   * Retrieve top rankings sorted by score descending
   */
  async getTopRankings(bootcampId: string, dayNumber: number): Promise<{ developerId: string; score: number }[]> {
    const key = `leaderboard:${bootcampId}:${dayNumber}`;

    if (this.client) {
      try {
        const raw = await this.client.zrevrange(key, 0, -1, 'WITHSCORES');
        const results: { developerId: string; score: number }[] = [];
        for (let i = 0; i < raw.length; i += 2) {
          results.push({
            developerId: raw[i],
            score: Number(raw[i + 1]),
          });
        }
        return results;
      } catch (err) {
        this.logger.error(`Redis ZREVRANGE failed: ${err.message}`);
      }
    }

    // In-memory fallback sorting
    const map = this.inMemoryLeaderboards.get(key) || new Map();
    const sorted = Array.from(map.entries())
      .map(([developerId, score]) => ({ developerId, score }))
      .sort((a, b) => b.score - a.score);

    return sorted;
  }
}
