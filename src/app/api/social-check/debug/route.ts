import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check Zyla API configuration and test a sample request
 */
export async function GET(request: NextRequest) {
  const zylaApiKey = process.env.ZYLA_API_KEY;

  const diagnostics = {
    apiKeyConfigured: !!zylaApiKey,
    apiKeyLength: zylaApiKey?.length || 0,
    apiKeyPrefix: zylaApiKey?.substring(0, 10) + '...' || 'NOT SET',
    timestamp: new Date().toISOString(),
    testHandle: 'google'
  };

  // Test actual API call
  if (zylaApiKey) {
    try {
      const testUrl = `https://zylalabs.com/api/7506/social+media+handle+insight+api/12091/instagram+username+validator?handle=google`;

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${zylaApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      return NextResponse.json({
        ...diagnostics,
        apiTest: {
          status: response.status,
          ok: response.ok,
          response: data,
          hasEarlyDetection: data.social_media?.[0]?.debug_info?.early_detection || null,
          wouldBeRejected: !!data.social_media?.[0]?.debug_info?.early_detection
        }
      });
    } catch (error: any) {
      return NextResponse.json({
        ...diagnostics,
        apiTest: {
          error: error.message,
          stack: error.stack
        }
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    ...diagnostics,
    apiTest: 'SKIPPED - No API key configured'
  });
}
