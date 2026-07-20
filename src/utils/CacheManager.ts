import { StoreResult } from "../types";
import { AggregatedResult } from "../middleware/Aggregator";

export interface CachedResult {
  results: StoreResult[];
  timestamp: number;
}

export class CacheManager {
  private cache: Map<string, CachedResult> = new Map();
  // Cache duration: 2 hours in milliseconds (7,200,000 ms)
  private readonly CACHE_DURATION_MS = 1000 * 60 * 60 * 2;

  async getOrFetch(query: string, fetcher: () => Promise<StoreResult[]>): Promise<StoreResult[]> {
    const normalizedQuery = query.toLowerCase().trim();
    const cached = this.cache.get(normalizedQuery);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION_MS) {
      console.log(`⚡ Fetched from cache for query: ${normalizedQuery}`);
      return cached.results;
    }

    console.log(`🔍 Fetching fresh data for query: ${normalizedQuery}`);
    const freshData = await fetcher();

    if (freshData && freshData.length > 0) {
      this.cache.set(normalizedQuery, {
        results: freshData,
        timestamp: now
      });
    }

    return freshData;
  }
}

export const cacheManager = new CacheManager();
