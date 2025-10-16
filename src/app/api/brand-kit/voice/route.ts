import { NextRequest, NextResponse } from 'next/server';
import { BrandKitService } from '@/lib/services/brandKit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, voice, searchTerm } = body;

    if (!brandName || !voice || !searchTerm) {
      return NextResponse.json(
        { error: 'Missing required fields: brandName, voice, searchTerm' },
        { status: 400 }
      );
    }

    if (!['modern', 'playful', 'serious'].includes(voice)) {
      return NextResponse.json(
        { error: 'Invalid voice. Must be modern, playful, or serious' },
        { status: 400 }
      );
    }

    const brandKitService = new BrandKitService();
    const result = await brandKitService.generateVoiceSpecificContent({
      brandName,
      voice: voice as 'modern' | 'playful' | 'serious',
      searchTerm
    });

    return NextResponse.json({
      success: true,
      taglines: result.taglines,
      logoPrompts: result.logoPrompts
    });

  } catch (error) {
    console.error('Voice-specific content generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate voice-specific content' },
      { status: 500 }
    );
  }
}
