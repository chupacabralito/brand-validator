import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics';

// Mark this route as dynamic to prevent static rendering
export const dynamic = 'force-dynamic';

const analytics = new AnalyticsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'session':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required for session stats' },
            { status: 400 }
          );
        }
        const sessionStats = await analytics.getSessionStats(sessionId);
        return NextResponse.json(sessionStats);

      case 'popular-domains':
        const popularDomains = await analytics.getPopularDomains(10);
        return NextResponse.json(popularDomains);

      case 'popular-ideas':
        const popularIdeas = await analytics.getPopularIdeas(10);
        return NextResponse.json(popularIdeas);

      case 'conversions':
        const conversionStats = await analytics.getConversionStats();
        return NextResponse.json(conversionStats);

      case 'overview':
      default:
        const [popularDomainsData, popularIdeasData, conversionStatsData] = await Promise.all([
          analytics.getPopularDomains(5),
          analytics.getPopularIdeas(5),
          analytics.getConversionStats()
        ]);

        return NextResponse.json({
          popularDomains: popularDomainsData,
          popularIdeas: popularIdeasData,
          conversions: conversionStatsData
        });
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}




