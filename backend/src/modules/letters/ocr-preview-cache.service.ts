import { Injectable } from '@nestjs/common';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

@Injectable()
export class OcrPreviewCacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number) {
    const ttlMs = Math.max(ttlSeconds, 1) * 1000;
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  makeKey(parts: Record<string, unknown>) {
    return Object.entries(parts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${String(v ?? '')}`)
      .join('&');
  }
}

