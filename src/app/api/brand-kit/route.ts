import { NextRequest, NextResponse } from 'next/server';
import { BrandKitService } from '@/lib/services/brandKit';
import { AIProviderError, toPublicAIError } from '@/lib/utils/aiErrors';
import {
  parseBrandKitRequest,
  readJsonObject,
  validationErrorResponse
} from '@/lib/utils/requestValidation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    if (!body.success) {
      return validationErrorResponse(body);
    }

    const input = parseBrandKitRequest(body.data);
    if (!input.success) {
      return validationErrorResponse(input);
    }

    const brandKitService = new BrandKitService(process.env.AI_MODEL || 'claude-3.5');
    const result = await brandKitService.generateBrandKit(input.data);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AIProviderError) {
      console.error('Brand kit generation error:', {
        provider: error.provider,
        status: error.status,
        code: error.code,
        message: error.providerMessage
      });
    } else {
      console.error('Brand kit generation error:', error);
    }

    const publicError = toPublicAIError(error, 'Brand kit');
    return NextResponse.json(publicError.body, { status: publicError.status });
  }
}
