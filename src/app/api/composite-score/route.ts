import { NextRequest, NextResponse } from 'next/server';
import { CompositeScoreService } from '@/lib/services/compositeScore';
import {
  parseCompositeScoreRequest,
  readJsonObject,
  validationErrorResponse
} from '@/lib/utils/requestValidation';

export const dynamic = 'force-dynamic';

const compositeScoreService = new CompositeScoreService();

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    if (!body.success) {
      return validationErrorResponse(body);
    }

    const parsed = parseCompositeScoreRequest(body.data);
    if (!parsed.success) {
      return validationErrorResponse(parsed);
    }

    const { domainResult, socialResult, trademarkResult, brandKit, selectedTrademarkCategory } = parsed.data;

    const result = compositeScoreService.calculateCompositeScore({
      domainResult,
      socialResult,
      trademarkResult,
      brandKit,
      selectedTrademarkCategory
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating composite score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate composite score' },
      { status: 500 }
    );
  }
}
