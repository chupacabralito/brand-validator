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

    // Get or create session (non-blocking - database issues shouldn't break domain check)
    if (!sessionId) {
      sessionId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    try {
      await analytics.getOrCreateSession(
        sessionId,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('referer') || undefined
      );
    } catch (error) {
      console.warn('Failed to create session (non-blocking):', error instanceof Error ? error.message : error);
      // Continue without session tracking - don't break the domain check
    }

    // Check availability - for single domain, include alternatives
    if (domainsToCheck.length === 1) {
      const domainResult = await domainService.checkDomainAvailability(domainsToCheck[0], true, refresh);

      // Convert to expected format
      const finalResult = {
        query: domainResult.domain,
        root: domainResult.domain.split('.')[0],
        tld: '.' + domainResult.domain.split('.').slice(1).join('.'),
        available: domainResult.available,
        status: domainResult.available ? 'available' as const : 'taken' as const,
        alternates: (domainResult.alternatives || []).map(alt => ({
          domain: alt.domain,
          available: alt.available,
          status: alt.available ? 'available' as const : 'taken' as const,
          score: alt.score
        })),
        dnsHistoryFlag: domainResult.available ? undefined : 'unknown' as const,
        registrar: domainResult.registrar,
        registrationDate: domainResult.registrationDate,
        expirationDate: domainResult.expirationDate,
        pricing: domainResult.pricing,
        lastChecked: domainResult.lastChecked,
        cacheExpiry: domainResult.cacheExpiry,
        fromCache: domainResult.fromCache
      };

      const responseTime = Date.now() - startTime;

      // Track the search (non-blocking - database issues shouldn't break domain check)
      try {
        await analytics.trackSearch(
          sessionId,
          domain,
          'domain',
          { domainResult: finalResult },
          responseTime,
          true
        );
      } catch (error) {
        console.warn('Failed to track search (non-blocking):', error instanceof Error ? error.message : error);
      }

      // Track analytics event (non-blocking - database issues shouldn't break domain check)
      try {
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
      } catch (error) {
        console.warn('Failed to track event (non-blocking):', error instanceof Error ? error.message : error);
      }

      const response = NextResponse.json(finalResult);

      // Set session cookie
      response.cookies.set('pg_aff_src', sessionId, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });

      return response;
    }

    // Check availability for multiple domains (name only without TLD)
    // Use Promise.allSettled to handle individual failures gracefully
    const results = await Promise.allSettled(
      domainsToCheck.map(async (domainToCheck) => {
        const domainResult = await domainService.checkDomainAvailability(domainToCheck, false, refresh); // Don't include alternatives for individual checks

        // Convert to expected format with new status field
        return {
          query: domainResult.domain,
          root: domainResult.domain.split('.')[0],
          tld: '.' + domainResult.domain.split('.').slice(1).join('.'),
          available: domainResult.available,
          status: domainResult.available ? 'available' as const : 'taken' as const,
          alternates: [], // Will be populated later for the primary result
          dnsHistoryFlag: domainResult.available ? undefined : 'unknown' as const,
          registrar: domainResult.registrar,
          registrationDate: domainResult.registrationDate,
          expirationDate: domainResult.expirationDate,
          pricing: domainResult.pricing,
          lastChecked: domainResult.lastChecked,
          cacheExpiry: domainResult.cacheExpiry,
          fromCache: domainResult.fromCache
        };
      })
    );

    // Filter out failed checks and extract successful results
    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value);

    // Log any failures
    results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .forEach((result, index) => {
        console.error(`Failed to check ${domainsToCheck[index]}:`, result.reason);
      });

    // If all checks failed, return error
    if (successfulResults.length === 0) {
      return NextResponse.json(
        { error: 'All domain checks failed' },
        { status: 500 }
      );
    }

    const responseTime = Date.now() - startTime;

    // If checking multiple domains (name without TLD), always return .com as primary
    let finalResult;
    if (isNameOnly && domainsToCheck.length > 1) {
      // Always use .com as the primary result
      const comResult = successfulResults.find(r => r.tld === '.com') || successfulResults[0];

      // Create alternates from all other TLDs that were successfully checked
      const allAlternates = successfulResults
        .filter(r => r.query !== comResult.query) // Exclude the .com result
        .map(r => ({
          domain: r.query,
          available: r.available,
          status: r.status,
          score: r.tld === '.net' ? 95 : r.tld === '.org' ? 90 : r.tld === '.io' ? 85 : r.tld === '.co' ? 80 : 75,
          pricing: r.pricing
        }))
        .sort((a, b) => b.score - a.score);

      finalResult = {
        ...comResult,
        alternates: allAlternates,
        query: comResult.query, // Show "pvvcaaa.com" not "pvvcaaa"
        root: domain,
        tld: '.com'
      };
    } else {
      finalResult = successfulResults[0];
    }

    // Track the search (non-blocking - database issues shouldn't break domain check)
    try {
      await analytics.trackSearch(
        sessionId,
        domain,
        'domain',
        { domainResult: finalResult },
        responseTime,
        true
      );
    } catch (error) {
      console.warn('Failed to track search (non-blocking):', error instanceof Error ? error.message : error);
    }

    // Track analytics event (non-blocking - database issues shouldn't break domain check)
    try {
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
    } catch (error) {
      console.warn('Failed to track event (non-blocking):', error instanceof Error ? error.message : error);
    }

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

    // Track failed search (non-blocking - database issues shouldn't break error response)
    if (sessionId) {
      try {
        await analytics.trackSearch(
          sessionId,
          domain || 'unknown',
          'domain',
          {},
          responseTime,
          false,
          error instanceof Error ? error.message : 'Unknown error'
        );
      } catch (trackError) {
        console.warn('Failed to track error (non-blocking):', trackError instanceof Error ? trackError.message : trackError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
