import { NextRequest, NextResponse } from 'next/server';
import { TrademarkSearchService } from '@/lib/services/trademarkSearch';

export const dynamic = 'force-dynamic';

// Initialize trademark service with API credentials from environment
const trademarkService = new TrademarkSearchService(
  process.env.USPTO_API_KEY,
  process.env.ZYLA_TRADEMARK_API_KEY,
  process.env.MARKER_API_USERNAME,
  process.env.MARKER_API_PASSWORD
);

// In-memory cache for trademark searches
interface CacheEntry {
  result: any;
  timestamp: number;
}

const trademarkCache = new Map<string, CacheEntry>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache (trademarks change rarely)

// In-flight request deduplication
const pendingRequests = new Map<string, Promise<any>>();

function getCacheKey(brandName: string, classes: number[], includeInternational: boolean): string {
  const classesStr = classes.length > 0 ? classes.sort().join(',') : 'all';
  const intlStr = includeInternational ? 'intl' : 'us';
  return `tm:${brandName.toLowerCase()}:${classesStr}:${intlStr}`;
}

function getCachedResult(brandName: string, classes: number[], includeInternational: boolean): any | null {
  const cacheKey = getCacheKey(brandName, classes, includeInternational);
  const cached = trademarkCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`[CACHE HIT] Trademark search for ${brandName}`);
    return cached.result;
  }

  // Clean up expired cache entry
  if (cached) {
    trademarkCache.delete(cacheKey);
  }

  return null;
}

function setCachedResult(brandName: string, classes: number[], includeInternational: boolean, result: any): void {
  const cacheKey = getCacheKey(brandName, classes, includeInternational);
  trademarkCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  console.log(`[CACHE SET] Trademark search for ${brandName}`);
}

export async function POST(request: NextRequest) {
  try {
    const { brandName, classes, includeInternational } = await request.json();

    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    const classesArray = classes || [];
    const includeIntl = includeInternational || false;

    // Check cache first
    const cachedResult = getCachedResult(brandName, classesArray, includeIntl);
    if (cachedResult) {
      const response = NextResponse.json({
        ...cachedResult,
        fromCache: true,
        cacheTimestamp: Date.now()
      });

      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=600'); // 10 minutes
      response.headers.set('X-Cache-Status', 'HIT');

      return response;
    }

    // Check if there's already a pending request for this trademark
    const cacheKey = getCacheKey(brandName, classesArray, includeIntl);
    let pendingRequest = pendingRequests.get(cacheKey);

    if (pendingRequest) {
      console.log(`[DEDUP] Waiting for in-flight request for ${brandName}`);
      const result = await pendingRequest;

      // Return the result from the pending request
      const response = NextResponse.json({
        ...result,
        fromCache: false,
        deduplicated: true
      });

      response.headers.set('X-Cache-Status', 'DEDUP');

      return response;
    }

    // Create new request and store it
    const requestPromise = trademarkService.performComprehensiveSearch(
      brandName,
      classesArray,
      includeIntl
    );
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache the result
      setCachedResult(brandName, classesArray, includeIntl, result);

      const response = NextResponse.json({
        ...result,
        fromCache: false,
        cacheTimestamp: Date.now()
      });

      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=600'); // 10 minutes
      response.headers.set('X-Cache-Status', 'MISS');

      return response;
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey);
    }
  } catch (error: any) {
    console.error('Trademark search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform trademark search' },
      { status: 500 }
    );
  }
}




