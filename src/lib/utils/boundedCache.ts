export interface BoundedMemoryCacheOptions {
  ttlMs: number;
  maxEntries: number;
}

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export class BoundedMemoryCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options: BoundedMemoryCacheOptions) {
    this.ttlMs = options.ttlMs;
    this.maxEntries = options.maxEntries;
  }

  get(key: string): T | null {
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return null;
    }

    // Refresh insertion order to keep recently used keys hot.
    this.entries.delete(key);
    this.entries.set(key, entry);

    return entry.value;
  }

  set(key: string, value: T): void {
    this.pruneExpired();

    if (this.entries.has(key)) {
      this.entries.delete(key);
    }

    this.entries.set(key, {
      expiresAt: Date.now() + this.ttlMs,
      value
    });

    this.pruneOverflow();
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    this.pruneExpired();
    return this.entries.size;
  }

  private pruneExpired(): void {
    const now = Date.now();

    for (const [key, entry] of this.entries.entries()) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private pruneOverflow(): void {
    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;

      if (!oldestKey) {
        return;
      }

      this.entries.delete(oldestKey);
    }
  }
}
