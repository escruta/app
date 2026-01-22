interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class LRUCache {
  private cache = new Map<string, CacheItem<unknown>>();
  private maxSize = 50;

  get<T>(key: string): CacheItem<T> | undefined {
    const item = this.cache.get(key);
    if (item) {
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item as CacheItem<T> | undefined;
  }

  set<T>(key: string, value: CacheItem<T>): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

export const cacheInstance = new LRUCache();

function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return String(obj);
  if (typeof obj !== "object") return String(obj);

  const sorted = Object.keys(obj as object)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = stableStringify((obj as Record<string, unknown>)[key]);
        return acc;
      },
      {} as Record<string, unknown>,
    );

  return JSON.stringify(sorted);
}

export function generateCacheKey(
  endpoint: string,
  options?: RequestConfig,
): string {
  const { method = "GET", params, body, data } = options || {};
  return `${method}:${endpoint}:${stableStringify(params)}:${stableStringify(
    body,
  )}:${stableStringify(data)}`;
}
