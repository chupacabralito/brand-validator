import { NextRequest, NextResponse } from 'next/server';
import { affiliate } from '@/lib/services/affiliates';
import { AnalyticsService } from '@/lib/services/analytics';

export const dynamic = 'force-dynamic';

const analytics = new AnalyticsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partner = searchParams.get('partner');
    const offer = searchParams.get('offer');
    const url = searchParams.get('url');
    const brandName = searchParams.get('brandName');
    const tagline = searchParams.get('tagline');
    const logoPrompt = searchParams.get('logoPrompt');

    if (!partner || !offer || !url) {
      return NextResponse.json(
        { error: 'Partner, offer, and url are required' },
        { status: 400 }
      );
    }

    const validPartners = [
      'namecheap', 'godaddy', 'bluehost', 'domaincom', 'hostinger', 'networksolutions', 'spaceship',
      'logoai', 'zoviz', 'logome',
      'legalzoom', 'trademarkengine', 'trademarkfactory', 'corpnet', 'rocketlawyer',
      'buffer', 'hootsuite', 'later', 'linktree'
    ];
    if (!validPartners.includes(partner)) {
      return NextResponse.json(
        { error: 'Invalid partner' },
        { status: 400 }
      );
    }

    const validOffers = ['domain', 'brandkit', 'logo', 'trademark', 'search', 'filing', 'social'];
    if (!validOffers.includes(offer)) {
      return NextResponse.json(
        { error: 'Invalid offer type' },
        { status: 400 }
      );
    }

    // Get or create session
    let sessionId = request.cookies.get('pg_aff_src')?.value;
    if (!sessionId) {
      sessionId = generateSessionId();
    }

    await analytics.getOrCreateSession(
      sessionId,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('referer') || undefined
    );

    // Generate affiliate link based on partner
    let affiliateLink = '';
    const affiliateId = process.env[`AFF_${partner.toUpperCase()}_ID`] || '';
    
    switch (partner) {
      case 'namecheap':
        affiliateLink = affiliate.namecheap(url, affiliateId);
        break;
      case 'godaddy':
        affiliateLink = affiliate.godaddy(url, affiliateId);
        break;
      case 'bluehost':
        affiliateLink = affiliate.bluehost(url, affiliateId);
        break;
      case 'domaincom':
        affiliateLink = affiliate.domaincom(url, affiliateId);
        break;
      case 'hostinger':
        affiliateLink = affiliate.hostinger(url, affiliateId);
        break;
      case 'networksolutions':
        affiliateLink = affiliate.networksolutions(url, affiliateId);
        break;
      case 'spaceship':
        affiliateLink = affiliate.spaceship(url, affiliateId);
        break;
      case 'logoai':
        affiliateLink = affiliate.logoai(url, affiliateId);
        break;
      case 'zoviz':
        // Use new dynamic parameters if available, otherwise fallback to URL
        if (brandName && tagline && logoPrompt) {
          affiliateLink = affiliate.zoviz(brandName, tagline, logoPrompt, affiliateId);
        } else {
          // Fallback for old format
          affiliateLink = `https://zoviz.com/?ref=${affiliateId}&brand=${encodeURIComponent(url)}`;
        }
        break;
      case 'logome':
        affiliateLink = affiliate.logome(url, affiliateId);
        break;
      // Trademark filing services
      case 'legalzoom':
        affiliateLink = `https://www.legalzoom.com/business/trademark-registration?aid=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      case 'trademarkengine':
        affiliateLink = `https://www.trademarkengine.com/?ref=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      case 'trademarkfactory':
        affiliateLink = `https://trademarkfactory.com/affiliate?ref=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      case 'corpnet':
        affiliateLink = `https://www.corpnet.com/trademark/?ref=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      case 'rocketlawyer':
        affiliateLink = `https://www.rocketlawyer.com/business/trademark/?aid=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      // Social media management tools
      case 'buffer':
        affiliateLink = `https://buffer.com/?ref=${affiliateId}`;
        break;
      case 'hootsuite':
        affiliateLink = `https://www.hootsuite.com/?ref=${affiliateId}`;
        break;
      case 'later':
        affiliateLink = `https://later.com/?ref=${affiliateId}`;
        break;
      case 'linktree':
        affiliateLink = `https://linktr.ee/?ref=${affiliateId}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid partner' }, { status: 400 });
    }

    // Track the affiliate click
    await analytics.trackAffiliateClick(
      sessionId,
      partner,
      offer,
      affiliateLink,
      'brandvalidator',
      'affiliate',
      'click'
    );

    // Track analytics event
    await analytics.trackEvent(
      sessionId,
      'click',
      'affiliate_click',
      { partner, offer, url, affiliateUrl: affiliateLink },
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('referer') || undefined,
      '/api/affiliate/click'
    );

    // Set cookie for tracking and redirect
    const response = NextResponse.redirect(affiliateLink, 302);
    response.cookies.set('pg_aff_src', sessionId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('Affiliate click error:', error);
    return NextResponse.json(
      { error: 'Failed to process affiliate click' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('API received body:', body);

    const { partner, offer, url, brandName, tagline, logoPrompt } = body;
    console.log('Extracted values:', { partner, offer, url, brandName, tagline, logoPrompt });

    if (!partner || !offer || !url) {
      console.error('Missing required fields:', { partner, offer, url });
      return NextResponse.json(
        { error: 'Partner, offer, and url are required' },
        { status: 400 }
      );
    }

    const validPartners = [
      'namecheap', 'godaddy', 'bluehost', 'domaincom', 'hostinger', 'networksolutions', 'spaceship',
      'logoai', 'zoviz', 'logome',
      'legalzoom', 'trademarkengine', 'trademarkfactory', 'corpnet', 'rocketlawyer',
      'buffer', 'hootsuite', 'later', 'linktree'
    ];
    if (!validPartners.includes(partner)) {
      return NextResponse.json(
        { error: 'Invalid partner' },
        { status: 400 }
      );
    }

    const validOffers = ['domain', 'brandkit', 'logo', 'trademark', 'search', 'filing', 'social'];
    if (!validOffers.includes(offer)) {
      return NextResponse.json(
        { error: 'Invalid offer type' },
        { status: 400 }
      );
    }

    // Get or create session
    let sessionId = request.cookies.get('pg_aff_src')?.value;
    if (!sessionId) {
      sessionId = generateSessionId();
    }

    await analytics.getOrCreateSession(
      sessionId,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('referer') || undefined
    );

    // Generate affiliate link based on partner
    let affiliateLink = '';
    const affiliateId = process.env[`AFF_${partner.toUpperCase()}_ID`] || '';
    
    switch (partner) {
      case 'namecheap':
        affiliateLink = affiliate.namecheap(url, affiliateId);
        break;
      case 'godaddy':
        affiliateLink = affiliate.godaddy(url, affiliateId);
        break;
      case 'bluehost':
        affiliateLink = affiliate.bluehost(url, affiliateId);
        break;
      case 'domaincom':
        affiliateLink = affiliate.domaincom(url, affiliateId);
        break;
      case 'hostinger':
        affiliateLink = affiliate.hostinger(url, affiliateId);
        break;
      case 'networksolutions':
        affiliateLink = affiliate.networksolutions(url, affiliateId);
        break;
      case 'spaceship':
        affiliateLink = affiliate.spaceship(url, affiliateId);
        break;
      case 'logoai':
        affiliateLink = affiliate.logoai(url, affiliateId);
        break;
      case 'zoviz':
        // Use new dynamic parameters if available, otherwise fallback to URL
        if (brandName && tagline && logoPrompt) {
          affiliateLink = affiliate.zoviz(brandName, tagline, logoPrompt, affiliateId);
        } else {
          // Fallback for old format
          affiliateLink = `https://zoviz.com/?ref=${affiliateId}&brand=${encodeURIComponent(url)}`;
        }
        break;
      case 'logome':
        affiliateLink = affiliate.logome(url, affiliateId);
        break;
      // Trademark filing services
      case 'legalzoom':
        affiliateLink = `https://www.legalzoom.com/business/trademark-registration?aid=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      case 'trademarkengine':
        affiliateLink = `https://www.trademarkengine.com/?ref=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      case 'trademarkfactory':
        affiliateLink = `https://trademarkfactory.com/affiliate?ref=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      case 'corpnet':
        affiliateLink = `https://www.corpnet.com/trademark/?ref=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      case 'rocketlawyer':
        affiliateLink = `https://www.rocketlawyer.com/business/trademark/?aid=${affiliateId}&brand=${encodeURIComponent(url)}`;
        break;
      // Social media management tools
      case 'buffer':
        affiliateLink = `https://buffer.com/?ref=${affiliateId}`;
        break;
      case 'hootsuite':
        affiliateLink = `https://www.hootsuite.com/?ref=${affiliateId}`;
        break;
      case 'later':
        affiliateLink = `https://later.com/?ref=${affiliateId}`;
        break;
      case 'linktree':
        affiliateLink = `https://linktr.ee/?ref=${affiliateId}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid partner' }, { status: 400 });
    }

    // Track the affiliate click
    await analytics.trackAffiliateClick(
      sessionId,
      partner,
      offer,
      affiliateLink,
      'brandvalidator',
      'affiliate',
      'click'
    );

    // Track analytics event
    await analytics.trackEvent(
      sessionId,
      'click',
      'affiliate_click',
      { partner, offer, url, affiliateUrl: affiliateLink },
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('referer') || undefined,
      '/api/affiliate/click'
    );

    // Return the affiliate link for frontend to handle
    const response = NextResponse.json({ 
      success: true, 
      affiliateUrl: affiliateLink,
      partner,
      offer,
      url 
    });
    
    response.cookies.set('pg_aff_src', sessionId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('Affiliate click error:', error);
    return NextResponse.json(
      { error: 'Failed to process affiliate click' },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}