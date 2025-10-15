import { NextRequest, NextResponse } from 'next/server';
import { SocialService } from '@/lib/services/social';

const socialService = new SocialService();

export async function POST(request: NextRequest) {
  try {
    const { handleBase } = await request.json();

    if (!handleBase || typeof handleBase !== 'string') {
      return NextResponse.json(
        { error: 'Handle base is required' },
        { status: 400 }
      );
    }

    // Basic handle validation
    const handleRegex = /^[a-zA-Z0-9_]{1,30}$/;
    if (!handleRegex.test(handleBase)) {
      return NextResponse.json(
        { error: 'Invalid handle format' },
        { status: 400 }
      );
    }

    const result = await socialService.checkHandles(handleBase);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Social check error:', error);
    return NextResponse.json(
      { error: 'Failed to check social handles' },
      { status: 500 }
    );
  }
}
