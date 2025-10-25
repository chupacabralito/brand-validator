import { NextRequest, NextResponse } from 'next/server';
import { BrandKitService, BrandKitInput } from '@/lib/services/brandKit';

export const dynamic = 'force-dynamic';

const brandKitService = new BrandKitService(process.env.AI_MODEL || 'claude-3.5');

export async function POST(request: NextRequest) {
  try {
    const { idea, tone, audience, domain } = await request.json();

    if (!idea || typeof idea !== 'string') {
      return NextResponse.json(
        { error: 'Idea is required' },
        { status: 400 }
      );
    }

    // Tone is optional - defaults to generating "modern" first
    if (tone && !['modern', 'playful', 'formal'].includes(tone)) {
      return NextResponse.json(
        { error: 'Tone must be one of: modern, playful, formal' },
        { status: 400 }
      );
    }

    const input: BrandKitInput = {
      idea,
      tone,
      audience,
      domain
    };

    const result = await brandKitService.generateBrandKit(input);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Brand kit generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate brand kit' },
      { status: 500 }
    );
  }
}
