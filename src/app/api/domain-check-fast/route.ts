import { NextRequest, NextResponse } from 'next/server';
import { ProgressiveDomainService } from '@/lib/services/progressiveDomainService';

export const dynamic = 'force-dynamic';

/**
 * Fast domain check endpoint using Layer 2 verification
 *
 * Returns comprehensive DNS + HTTP probe results in 1-3 seconds
 * with 80-95% confidence, instead of waiting 10-15s for WHOIS.
 *
 * Benefits:
 * - 5-10x faster than WHOIS-only approach
 * - 80-95% accuracy (vs 100% WHOIS)
 * - Includes alternatives (unchecked for on-demand verification)
 *
 * For 100% authoritative results, use /api/domain-check-stream
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { domain } = await request.json();

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Validate domain format - accept both complete domains and name-only
    const completeDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    const nameOnlyRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?$/;

    if (!completeDomainRegex.test(domain) && !nameOnlyRegex.test(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain format' },
        { status: 400 }
      );
    }

    const service = new ProgressiveDomainService();

    // If name-only (no TLD), check .com and provide alternatives
    if (!completeDomainRegex.test(domain) && nameOnlyRegex.test(domain)) {
      const baseName = domain;
      const primaryDomain = baseName + '.com';

      // Check the .com domain
      const layer1 = await service.verifyLayer1(primaryDomain);
      const layer2 = await service.verifyLayer2(primaryDomain, layer1);

      // Generate alternatives for other TLDs
      const alternates = ['.net', '.org', '.io', '.co'].map(ext => ({
        domain: baseName + ext,
        available: undefined,
        status: undefined,
        score: ext === '.net' ? 95 : ext === '.org' ? 90 : ext === '.io' ? 85 : 80
      }));

      const responseTime = Date.now() - startTime;

      return NextResponse.json({
        query: primaryDomain,
        root: baseName,
        tld: '.com',
        available: layer2.available,
        status: layer2.available ? 'available' as const : 'taken' as const,
        confidence: layer2.confidence,
        verificationLayer: 2,
        evidence: layer2.evidence,
        alternates,
        pricing: layer2.pricing,
        registrar: layer2.registrar,
        registrationDate: layer2.registrationDate,
        expirationDate: layer2.expirationDate,
        lastChecked: layer2.completedAt,
        responseTime: `${responseTime}ms`,
        note: layer2.confidence < 95
          ? 'Fast verification (80-95% confidence). For 100% authoritative result, use /api/domain-check-stream'
          : 'High-confidence result from comprehensive DNS verification'
      });
    }

    // Complete domain with TLD
    const layer1 = await service.verifyLayer1(domain);
    const layer2 = await service.verifyLayer2(domain, layer1);

    // Generate alternatives (unchecked)
    const baseDomain = domain.replace(/\.(com|net|org|co|io|app|dev|tech)$/, '');
    const allExtensions = ['.net', '.io', '.org', '.co'];

    const alternates = allExtensions
      .map(ext => baseDomain + ext)
      .filter(altDomain => altDomain !== domain)
      .map(altDomain => {
        const tldScore: Record<string, number> = {
          '.net': 95, '.io': 85, '.org': 90, '.co': 80
        };
        const ext = '.' + altDomain.split('.').pop();

        return {
          domain: altDomain,
          available: undefined, // Unchecked
          status: undefined,
          score: tldScore[ext] || 75
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const responseTime = Date.now() - startTime;

    // Format response to match existing API
    const result = {
      query: domain,
      root: domain.split('.')[0],
      tld: '.' + domain.split('.').slice(1).join('.'),
      available: layer2.available,
      status: layer2.available ? 'available' as const : 'taken' as const,
      confidence: layer2.confidence,
      verificationLayer: 2,
      evidence: layer2.evidence,
      alternates,
      pricing: layer2.pricing,
      registrar: layer2.registrar,
      registrationDate: layer2.registrationDate,
      expirationDate: layer2.expirationDate,
      lastChecked: layer2.completedAt,
      responseTime: `${responseTime}ms`,
      note: layer2.confidence < 95
        ? 'Fast verification (80-95% confidence). For 100% authoritative result, use /api/domain-check-stream'
        : 'High-confidence result from comprehensive DNS verification'
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Fast domain check error:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}
