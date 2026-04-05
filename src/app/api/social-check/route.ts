import { NextRequest, NextResponse } from 'next/server';
import { SocialService } from '@/lib/services/social';
import { SocialCheckResult } from '@/lib/models/DomainResult';
import { BoundedMemoryCache } from '@/lib/utils/boundedCache';
import {
  parseSocialCheckRequest,
  readJsonObject,
  validationErrorResponse
} from '@/lib/utils/requestValidation';

export const dynamic = 'force-dynamic';

// Initialize social service with Zyla API key from environment
const socialService = new SocialService(process.env.ZYLA_API_KEY);

const socialCache = new BoundedMemoryCache<SocialCheckResult>({
  ttlMs: 5 * 60 * 1000,
  maxEntries: 250
});

// In-flight request deduplication
const pendingRequests = new Map<string, Promise<SocialCheckResult>>();

function getCacheKey(handleBase: string): string {
  return `social:${handleBase.toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    if (!body.success) {
      return validationErrorResponse(body);
    }

    const parsed = parseSocialCheckRequest(body.data);
    if (!parsed.success) {
      return validationErrorResponse(parsed);
    }

    const { handleBase } = parsed.data;
    const cacheKey = getCacheKey(handleBase);

    // Check cache first
    const cachedResult = socialCache.get(cacheKey);
    if (cachedResult) {
      const response = NextResponse.json({
        ...cachedResult,
        fromCache: true,
        cacheTimestamp: Date.now()
      });

      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      response.headers.set('X-Cache-Status', 'HIT');

      return response;
    }

    // Check if there's already a pending request for this handle
    const pendingRequest = pendingRequests.get(cacheKey);

    if (pendingRequest) {
      console.log(`[DEDUP] Waiting for in-flight request for ${handleBase}`);
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
    const requestPromise = socialService.checkHandles(handleBase);
    pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache the result
      socialCache.set(cacheKey, result);

      const response = NextResponse.json({
        ...result,
        fromCache: false,
        cacheTimestamp: Date.now()
      });

      // Add cache headers
      response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      response.headers.set('X-Cache-Status', 'MISS');

      return response;
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey);
    }
  } catch (error) {
    console.error('Social check error:', error);
    return NextResponse.json(
      { error: 'Failed to check social handles' },
      { status: 500 }
    );
  }
}
