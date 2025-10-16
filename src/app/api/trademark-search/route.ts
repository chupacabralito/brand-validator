import { NextRequest, NextResponse } from 'next/server';
import { TrademarkSearchService } from '@/lib/services/trademarkSearch';

export const dynamic = 'force-dynamic';

const trademarkService = new TrademarkSearchService();

export async function POST(request: NextRequest) {
  try {
    const { brandName, classes, includeInternational } = await request.json();
    
    if (!brandName) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    const result = await trademarkService.performComprehensiveSearch(
      brandName,
      classes || [],
      includeInternational || false
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Trademark search error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform trademark search' },
      { status: 500 }
    );
  }
}


