import { NextRequest, NextResponse } from 'next/server';
import { CompositeScoreService, CompositeScoreInput } from '@/lib/services/compositeScore';

export const dynamic = 'force-dynamic';

const compositeScoreService = new CompositeScoreService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Composite score API received:', body);
    const { domainResult, socialResult, trademarkResult, brandKit } = body as CompositeScoreInput;

    const result = compositeScoreService.calculateCompositeScore({
      domainResult,
      socialResult,
      trademarkResult,
      brandKit
    });

    console.log('Composite score calculated:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating composite score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate composite score' },
      { status: 500 }
    );
  }
}
