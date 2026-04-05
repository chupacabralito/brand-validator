import { NextRequest, NextResponse } from 'next/server';
import { TrademarkSearchResult, TrademarkSearchService } from '@/lib/services/trademarkSearch';
import { BoundedMemoryCache } from '@/lib/utils/boundedCache';
import {
  parseTrademarkSearchRequest,
  readJsonObject,
  validationErrorResponse
} from '@/lib/utils/requestValidation';

export const dynamic = 'force-dynamic';

// Initialize trademark service with API credentials from environment
const trademarkService = new TrademarkSearchService(
  process.env.USPTO_API_KEY,
  process.env.ZYLA_TRADEMARK_API_KEY,
  process.env.MARKER_API_USERNAME,
  process.env.MARKER_API_PASSWORD
);

const trademarkCache = new BoundedMemoryCache<TrademarkSearchResult>({
  ttlMs: 10 * 60 * 1000,
  maxEntries: 250
});

// In-flight request deduplication
const pendingRequests = new Map<string, Promise<TrademarkSearchResult>>();

function getCacheKey(brandName: string, classes: number[], includeInternational: boolean): string {
  const classesStr = classes.length > 0 ? [...classes].sort((a, b) => a - b).join(',') : 'all';
  const intlStr = includeInternational ? 'intl' : 'us';
  return `tm:${brandName.toLowerCase()}:${classesStr}:${intlStr}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    if (!body.success) {
      return validationErrorResponse(body);
    }

    const parsed = parseTrademarkSearchRequest(body.data);
    if (!parsed.success) {
      return validationErrorResponse(parsed);
    }

    const { brandName, classes: classesArray, includeInternational: includeIntl } = parsed.data;
    const cacheKey = getCacheKey(brandName, classesArray, includeIntl);

    // Check cache first
    const cachedResult = trademarkCache.get(cacheKey);
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
    const pendingRequest = pendingRequests.get(cacheKey);

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
      trademarkCache.set(cacheKey, result);

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
  } catch (error) {
    console.error('Trademark search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to perform trademark search' },
      { status: 500 }
    );
  }
}

