import { NextRequest, NextResponse } from 'next/server';
import { BrandKitService } from '@/lib/services/brandKit';
import { AIProviderError, toPublicAIError } from '@/lib/utils/aiErrors';
import {
  parseBrandKitVoiceRequest,
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

    const parsed = parseBrandKitVoiceRequest(body.data);
    if (!parsed.success) {
      return validationErrorResponse(parsed);
    }

    const { brandName, tone, searchTerm, regenerate, audience, regenerateOnly, actualValues } = parsed.data;

    const brandKitService = new BrandKitService();

    // Step 1: Analyze brand meaning (this is cached)
    const analysis = await brandKitService.analyzeBrandMeaning(brandName, searchTerm);

    // Step 2: Generate tone-specific creative
    // If regenerateOnly is specified, only regenerate that specific section
    if (regenerateOnly) {
      const sectionCreative = await brandKitService.generateSectionCreative(
        brandName,
        analysis,
        tone,
        regenerateOnly,
        audience,
        actualValues  // Pass actual values for logo prompt generation
      );

      return NextResponse.json({
        success: true,
        [regenerateOnly]: sectionCreative
      });
    }

    // Otherwise, generate all sections
    const toneCreative = await brandKitService.generateToneCreative(
      brandName,
      analysis,
      tone,
      audience,
      regenerate || false
    );

    return NextResponse.json({
      success: true,
      ...toneCreative  // Returns: tagline, logoPrompt, colors, typography
    });

  } catch (error) {
    if (error instanceof AIProviderError) {
      console.error('Tone-specific content generation error:', {
        provider: error.provider,
        status: error.status,
        code: error.code,
        message: error.providerMessage
      });
    } else {
      console.error('Tone-specific content generation error:', error);
    }

    const publicError = toPublicAIError(error, 'Brand kit content');
    return NextResponse.json(publicError.body, { status: publicError.status });
  }
}
