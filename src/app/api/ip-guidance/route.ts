import { NextRequest, NextResponse } from 'next/server';
import { IPService } from '@/lib/services/ip';

const ipService = new IPService();

export async function POST(request: NextRequest) {
  try {
    const { brandName, categories } = await request.json();

    if (!brandName || typeof brandName !== 'string') {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

    // Basic brand name validation
    if (brandName.length < 2 || brandName.length > 50) {
      return NextResponse.json(
        { error: 'Brand name must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    const result = ipService.generateGuidance(brandName, categories || []);

    return NextResponse.json(result);
  } catch (error) {
    console.error('IP guidance error:', error);
    return NextResponse.json(
      { error: 'Failed to generate IP guidance' },
      { status: 500 }
    );
  }
}
