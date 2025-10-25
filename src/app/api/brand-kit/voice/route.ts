import { NextRequest, NextResponse } from 'next/server';
import { BrandKitService } from '@/lib/services/brandKit';
import { BrandTone } from '@/lib/models/DomainResult';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, tone, searchTerm, regenerate, audience } = body;

    if (!brandName || !tone || !searchTerm) {
      return NextResponse.json(
        { error: 'Missing required fields: brandName, tone, searchTerm' },
        { status: 400 }
      );
    }

    if (!['modern', 'playful', 'formal'].includes(tone)) {
      return NextResponse.json(
        { error: 'Invalid tone. Must be modern, playful, or formal' },
        { status: 400 }
      );
    }

    const brandKitService = new BrandKitService();

    // Step 1: Analyze brand meaning (this is cached)
    const analysis = await (brandKitService as any).analyzeBrandMeaning(brandName, searchTerm);

    // Step 2: Generate tone-specific creative
    const toneCreative = await brandKitService.generateToneCreative(
      brandName,
      analysis,
      tone as BrandTone,
      audience,
      regenerate || false
    );

    return NextResponse.json({
      success: true,
      ...toneCreative  // Returns: tagline, logoPrompt, colors, typography
    });

  } catch (error) {
    console.error('Tone-specific content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tone-specific content' },
      { status: 500 }
    );
  }
}
