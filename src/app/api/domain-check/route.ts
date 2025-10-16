import { NextRequest, NextResponse } from 'next/server';
import { DomainService } from '@/lib/services/domainService';
import { AnalyticsService } from '@/lib/services/analytics';

export const dynamic = 'force-dynamic';

const domainService = new DomainService();
const analytics = new AnalyticsService();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let sessionId = request.cookies.get('pg_aff_src')?.value;
  let domain = 'unknown';

  try {
    const requestData = await request.json();
    domain = requestData.domain;
    const refresh = requestData.refresh === true; // Cache bypass flag

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    if (refresh) {
      console.log('Cache bypass requested for domain:', domain);
    }

    // Check if it's a complete domain or just a name without TLD
    const completeDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    const nameOnlyRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/;
    
    if (!completeDomainRegex.test(domain) && !nameOnlyRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    // If it's just a name without TLD, default to .com and check alternates
    let domainsToCheck = [domain];
    let isNameOnly = false;
    if (!completeDomainRegex.test(domain) && nameOnlyRegex.test(domain)) {
      isNameOnly = true;
      // Always check .com first, then common alternatives
      const commonTlds = ['.com', '.net', '.org', '.io', '.co'];
      domainsToCheck = commonTlds.map(tld => domain + tld);
    }

    // Get or create session
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }
    
    await analytics.getOrCreateSession(
      sessionId,
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('referer') || undefined
    );

    // Check availability for all domains using real WHOIS API
    const results = await Promise.all(
      domainsToCheck.map(async (domainToCheck) => {
        try {
          const domainResult = await domainService.checkDomainAvailability(domainToCheck, true, refresh);
          
          // Convert to expected format
          return {
            query: domainResult.domain,
            root: domainResult.domain.split('.')[0],
            tld: '.' + domainResult.domain.split('.').slice(1).join('.'),
            available: domainResult.available,
            alternates: domainResult.alternatives?.map(alt => ({
              domain: alt.domain,
              available: alt.available,
              score: alt.score
            })) || [],
            dnsHistoryFlag: domainResult.available ? undefined : 'unknown' as const,
            registrar: domainResult.registrar,
            registrationDate: domainResult.registrationDate,
            expirationDate: domainResult.expirationDate,
            pricing: domainResult.pricing,
            lastChecked: domainResult.lastChecked,
            cacheExpiry: domainResult.cacheExpiry,
            fromCache: domainResult.fromCache
          };
        } catch (error) {
          console.error(`Error checking ${domainToCheck}:`, error);
          // Don't return false data - propagate the error
          throw error;
        }
      })
    );

    const responseTime = Date.now() - startTime;

    // If checking multiple domains (name without TLD), always return .com as primary
    let finalResult;
    if (isNameOnly && domainsToCheck.length > 1) {
      // Always use .com as the primary result
      const comResult = results.find(r => r.tld === '.com') || results[0];

      // Create alternates from all other TLDs
      const allAlternates = results
        .filter(r => r.query !== comResult.query) // Exclude the .com result
        .map(r => ({
          domain: r.query,
          available: r.available,
          score: r.tld === '.net' ? 95 : r.tld === '.org' ? 90 : r.tld === '.io' ? 85 : r.tld === '.co' ? 80 : 75
        }))
        .sort((a, b) => b.score - a.score);

      finalResult = {
        ...comResult,
        alternates: allAlternates,
        query: comResult.query, // Show "pvvc.com" not "pvvc"
        root: domain,
        tld: '.com'
      };
    } else {
      finalResult = results[0];
    }

    // Track the search
    await analytics.trackSearch(
      sessionId,
      domain,
      'domain',
      { domainResult: finalResult },
      responseTime,
      true
    );

    // Track analytics event
    await analytics.trackEvent(
      sessionId,
      'search',
      'domain_check',
      { domain, available: finalResult.available },
      request.headers.get('user-agent') || undefined,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('referer') || undefined,
      '/api/domain-check'
    );

    const response = NextResponse.json(finalResult);
    
    // Set session cookie
    response.cookies.set('pg_aff_src', sessionId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });

    return response;
  } catch (error) {
    console.error('Domain check error:', error);
    
    const responseTime = Date.now() - startTime;
    
    // Track failed search
    if (sessionId) {
      await analytics.trackSearch(
        sessionId,
        domain || 'unknown',
        'domain',
        {},
        responseTime,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }

    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
