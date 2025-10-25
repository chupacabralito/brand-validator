import { NextRequest, NextResponse } from 'next/server';
import { SocialService } from '@/lib/services/social';

export const dynamic = 'force-dynamic';

// Initialize social service with Zyla API key from environment
const socialService = new SocialService(process.env.ZYLA_API_KEY);

// In-memory cache for social handle checks
interface CacheEntry {
  result: any;
  timestamp: number;
}

const socialCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// In-flight request deduplication
const pendingRequests = new Map<string, Promise<any>>();

function getCacheKey(handleBase: string): string {
  return `social:${handleBase.toLowerCase()}`;
}

function getCachedResult(handleBase: string): any | null {
  const cacheKey = getCacheKey(handleBase);
  const cached = socialCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    console.log(`[CACHE HIT] Social check for ${handleBase}`);
    return cached.result;
  }

  // Clean up expired cache entry
  if (cached) {
    socialCache.delete(cacheKey);
  }

  return null;
}

function setCachedResult(handleBase: string, result: any): void {
  const cacheKey = getCacheKey(handleBase);
  socialCache.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  console.log(`[CACHE SET] Social check for ${handleBase}`);
}

export async function POST(request: NextRequest) {
  try {
    const { handleBase } = await request.json();

    if (!handleBase || typeof handleBase !== 'string') {
      return NextResponse.json(
        { error: 'Handle base is required' },
        { status: 400 }
      );
    }

    // Basic handle validation
    const handleRegex = /^[a-zA-Z0-9_]{1,30}$/;
    if (!handleRegex.test(handleBase)) {
      return NextResponse.json(
        { error: 'Invalid handle format' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedResult = getCachedResult(handleBase);
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
    const cacheKey = getCacheKey(handleBase);
    let pendingRequest = pendingRequests.get(cacheKey);

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
      setCachedResult(handleBase, result);

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
