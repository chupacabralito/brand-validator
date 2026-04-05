import { NextRequest, NextResponse } from 'next/server';
import { IPService } from '@/lib/services/ip';
import {
  parseIPGuidanceRequest,
  readJsonObject,
  validationErrorResponse
} from '@/lib/utils/requestValidation';

export const dynamic = 'force-dynamic';

const ipService = new IPService();

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    if (!body.success) {
      return validationErrorResponse(body);
    }

    const parsed = parseIPGuidanceRequest(body.data);
    if (!parsed.success) {
      return validationErrorResponse(parsed);
    }

    const result = ipService.generateGuidance(parsed.data.brandName, parsed.data.categories);

    return NextResponse.json(result);
  } catch (error) {
    console.error('IP guidance error:', error);
    return NextResponse.json(
      { error: 'Failed to generate IP guidance' },
      { status: 500 }
    );
  }
}
