import { prisma } from '../db';
import { DomainResult, BrandKit, IPGuidance, SocialCheckResult } from '../models/DomainResult';

export class AnalyticsService {
  async trackSearch(
    sessionId: string,
    query: string,
    queryType: 'domain' | 'idea',
    results: {
      domainResult?: DomainResult;
      brandKit?: BrandKit;
      ipGuidance?: IPGuidance;
      socialResult?: SocialCheckResult;
    },
    responseTime?: number,
    success: boolean = true,
    errorMessage?: string
  ) {
    try {
      await prisma.searchLog.create({
        data: {
          sessionId,
          query,
          queryType,
          domainResult: results.domainResult ? JSON.parse(JSON.stringify(results.domainResult)) : null,
          brandKitResult: results.brandKit ? JSON.parse(JSON.stringify(results.brandKit)) : null,
          ipGuidanceResult: results.ipGuidance ? JSON.parse(JSON.stringify(results.ipGuidance)) : null,
          socialResult: results.socialResult ? JSON.parse(JSON.stringify(results.socialResult)) : null,
          responseTime,
          success,
          errorMessage
        }
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }

  async trackAffiliateClick(
    sessionId: string,
    partner: string,
    offer: string,
    url: string,
    utmSource: string,
    utmMedium: string,
    utmCampaign: string,
    utmContent?: string
  ) {
    try {
      await prisma.affiliateClick.create({
        data: {
          sessionId,
          partner,
          offer,
          url,
          utmSource,
          utmMedium,
          utmCampaign,
          utmContent
        }
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
  }

  async trackEvent(
    sessionId: string | null,
    eventType: string,
    eventName: string,
    properties?: Record<string, any>,
    userAgent?: string,
    ipAddress?: string,
    referrer?: string,
    page?: string
  ) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          sessionId,
          eventType,
          eventName,
          properties: properties ? JSON.parse(JSON.stringify(properties)) : null,
          userAgent,
          ipAddress,
          referrer,
          page
        }
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  async getOrCreateSession(
    sessionId: string,
    userAgent?: string,
    ipAddress?: string,
    referrer?: string
  ) {
    try {
      let session = await prisma.session.findUnique({
        where: { sessionId }
      });

      if (!session) {
        session = await prisma.session.create({
          data: {
            sessionId,
            userAgent,
            ipAddress,
            referrer
          }
        });
      } else {
        // Update session with latest info
        session = await prisma.session.update({
          where: { sessionId },
          data: {
            userAgent: userAgent || session.userAgent,
            ipAddress: ipAddress || session.ipAddress,
            referrer: referrer || session.referrer,
            updatedAt: new Date()
          }
        });
      }

      return session;
    } catch (error) {
      console.error('Failed to get or create session:', error);
      return null;
    }
  }

  async getSessionStats(sessionId: string) {
    try {
      const [searchCount, clickCount, recentSearches] = await Promise.all([
        prisma.searchLog.count({
          where: { sessionId }
        }),
        prisma.affiliateClick.count({
          where: { sessionId }
        }),
        prisma.searchLog.findMany({
          where: { sessionId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            query: true,
            queryType: true,
            createdAt: true,
            success: true
          }
        })
      ]);

      return {
        searchCount,
        clickCount,
        recentSearches
      };
    } catch (error) {
      console.error('Failed to get session stats:', error);
      return {
        searchCount: 0,
        clickCount: 0,
        recentSearches: []
      };
    }
  }

  async getPopularDomains(limit: number = 10) {
    try {
      const popularDomains = await prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          queryType: 'domain',
          success: true
        },
        _count: {
          query: true
        },
        orderBy: {
          _count: {
            query: 'desc'
          }
        },
        take: limit
      });

      return popularDomains.map(item => ({
        domain: item.query,
        searchCount: item._count.query
      }));
    } catch (error) {
      console.error('Failed to get popular domains:', error);
      return [];
    }
  }

  async getPopularIdeas(limit: number = 10) {
    try {
      const popularIdeas = await prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          queryType: 'idea',
          success: true
        },
        _count: {
          query: true
        },
        orderBy: {
          _count: {
            query: 'desc'
          }
        },
        take: limit
      });

      return popularIdeas.map(item => ({
        idea: item.query,
        searchCount: item._count.query
      }));
    } catch (error) {
      console.error('Failed to get popular ideas:', error);
      return [];
    }
  }

  async getConversionStats() {
    try {
      const [totalClicks, convertedClicks, totalSearches] = await Promise.all([
        prisma.affiliateClick.count(),
        prisma.affiliateClick.count({
          where: { converted: true }
        }),
        prisma.searchLog.count({
          where: { success: true }
        })
      ]);

      const conversionRate = totalClicks > 0 ? (convertedClicks / totalClicks) * 100 : 0;

      return {
        totalClicks,
        convertedClicks,
        totalSearches,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get conversion stats:', error);
      return {
        totalClicks: 0,
        convertedClicks: 0,
        totalSearches: 0,
        conversionRate: 0
      };
    }
  }
}


