import { SocialCheckResult, SocialHandleResult } from '../models/DomainResult';
import { SocialHandleHeuristics } from './socialHeuristics';

type SocialPlatform = "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "facebook" | "snapchat" | "pinterest" | "discord";

// Zyla API response interfaces
interface ZylaSocialMedia {
  is_available: boolean;
  name: string;
  url: string;
}

interface ZylaResponse {
  handle: string;
  social_media: ZylaSocialMedia[];
  status: number;
  success: boolean;
}

export class SocialService {
  private heuristics: SocialHandleHeuristics;
  private zylaApiKey: string;

  constructor(zylaApiKey?: string) {
    this.heuristics = new SocialHandleHeuristics();
    this.zylaApiKey = zylaApiKey || process.env.ZYLA_API_KEY || '';
  }

  async checkHandles(baseHandle: string): Promise<SocialCheckResult> {
    // Platforms verified by Zyla API (priority platforms)
    const zylaPlatforms: SocialPlatform[] = ['instagram', 'tiktok', 'facebook'];

    // Platforms using heuristics
    const heuristicPlatforms: SocialPlatform[] = ['twitter', 'youtube', 'linkedin', 'snapchat', 'pinterest', 'discord'];

    let results: SocialHandleResult[] = [];

    // Try Zyla API for priority platforms if configured
    if (this.zylaApiKey) {
      console.log('Using Zyla API for Instagram, TikTok, Facebook...');
      try {
        const zylaResults = await this.checkWithZylaAPI(baseHandle, zylaPlatforms);

        // If API returned no results (all platforms failed), fall back to heuristics
        if (zylaResults.length === 0) {
          console.log('Zyla API returned no results, falling back to heuristics for all platforms');
          results.push(...zylaPlatforms.map(p => this.checkPlatform(baseHandle, p)));
        } else {
          // Use API results for successful platforms, heuristics for failed ones
          const successfulPlatforms = new Set(zylaResults.map(r => r.platform));
          results.push(...zylaResults);

          // Add heuristics for any platforms that failed
          const failedPlatforms = zylaPlatforms.filter(p => !successfulPlatforms.has(p));
          if (failedPlatforms.length > 0) {
            console.log(`Falling back to heuristics for failed platforms: ${failedPlatforms.join(', ')}`);
            results.push(...failedPlatforms.map(p => this.checkPlatform(baseHandle, p)));
          }
        }
      } catch (error) {
        console.error('Zyla API failed, falling back to heuristics:', error);
        // Fallback to heuristics for Zyla platforms
        results.push(...zylaPlatforms.map(p => this.checkPlatform(baseHandle, p)));
      }
    } else {
      console.log('Zyla API not configured, using heuristics for all platforms');
      // Use heuristics for Zyla platforms if no API key
      results.push(...zylaPlatforms.map(p => this.checkPlatform(baseHandle, p)));
    }

    // Always use heuristics for remaining platforms
    results.push(...heuristicPlatforms.map(p => this.checkPlatform(baseHandle, p)));

    // Sort by platform order
    const platformOrder: SocialPlatform[] = ['instagram', 'tiktok', 'twitter', 'youtube', 'linkedin', 'facebook', 'snapchat', 'pinterest', 'discord'];
    results.sort((a, b) => platformOrder.indexOf(a.platform as SocialPlatform) - platformOrder.indexOf(b.platform as SocialPlatform));

    const overallScore = this.calculateOverallScore(results);

    return {
      baseHandle,
      platforms: results,
      overallScore
    };
  }

  /**
   * Check handle availability using Zyla API
   * Makes parallel requests to Instagram, TikTok, and Facebook endpoints
   */
  private async checkWithZylaAPI(handle: string, platforms: SocialPlatform[]): Promise<SocialHandleResult[]> {
    const results: SocialHandleResult[] = [];

    // Zyla Social Media Handle Insight API endpoint IDs
    const endpoints = {
      instagram: '12091',
      tiktok: '12079',
      facebook: '12086'
    };

    // Make parallel API calls
    const promises = platforms.map(async (platform) => {
      if (!endpoints[platform as keyof typeof endpoints]) {
        // Skip platforms not supported by Zyla
        return null;
      }

      const endpointId = endpoints[platform as keyof typeof endpoints];
      const url = `https://zylalabs.com/api/7506/social+media+handle+insight+api/${endpointId}/${platform}+username+validator?handle=${encodeURIComponent(handle)}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.zylaApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error(`Zyla API ${platform} check failed: ${response.status}`);
          return null;
        }

        const data: ZylaResponse = await response.json();

        if (data.success && data.social_media && data.social_media.length > 0) {
          const platformData = data.social_media[0];

          // If is_available is null (error occurred), skip this platform
          if (platformData.is_available === null || platformData.is_available === undefined) {
            console.error(`Zyla API ${platform} returned null availability`);
            return null;
          }

          return {
            platform: platform as SocialPlatform,
            handle: this.formatHandle(handle, platform),
            available: platformData.is_available,
            url: platformData.url || this.getPlatformUrl(platform, handle),
            confidence: 95, // High confidence - verified by API
            factors: ['Verified by Zyla API', 'Real-time availability check']
          };
        }

        return null;
      } catch (error) {
        console.error(`Zyla API ${platform} error:`, error);
        return null;
      }
    });

    const apiResults = await Promise.all(promises);

    // Filter out nulls and add successful results
    for (const result of apiResults) {
      if (result) {
        results.push(result);
        console.log(`Zyla API: ${result.platform} @${handle} - ${result.available ? 'Available' : 'Taken'}`);
      }
    }

    return results;
  }

  private checkPlatform(handle: string, platform: SocialPlatform): SocialHandleResult {
    const evaluation = this.heuristics.evaluateHandle(handle, platform);

    return {
      platform,
      handle: this.formatHandle(handle, platform),
      available: evaluation.available,
      url: this.getPlatformUrl(platform, handle),
      confidence: evaluation.confidence,
      factors: evaluation.factors
    };
  }

  private formatHandle(handle: string, platform: string): string {
    // Instagram, TikTok, Twitter use @
    if (['instagram', 'tiktok', 'twitter'].includes(platform.toLowerCase())) {
      return `@${handle}`;
    }
    return handle;
  }

  private getPlatformUrl(platform: string, handle: string): string {
    const cleanHandle = handle.replace('@', '').trim();
    const normalized = platform.toLowerCase();

    switch (normalized) {
      case 'instagram':
        return `https://www.instagram.com/${cleanHandle}/`;
      case 'tiktok':
        return `https://www.tiktok.com/@${cleanHandle}`;
      case 'twitter':
        return `https://twitter.com/${cleanHandle}`;
      case 'youtube':
        return `https://www.youtube.com/@${cleanHandle}`;
      case 'linkedin':
        return `https://www.linkedin.com/in/${cleanHandle}`;
      case 'facebook':
        return `https://www.facebook.com/${cleanHandle}`;
      case 'snapchat':
        return `https://www.snapchat.com/add/${cleanHandle}`;
      case 'pinterest':
        return `https://www.pinterest.com/${cleanHandle}`;
      case 'discord':
        return `https://discord.gg/${cleanHandle}`;
      default:
        return '#';
    }
  }


  private calculateOverallScore(results: SocialHandleResult[]): number {
    if (results.length === 0) return 0;

    const availableCount = results.filter(result => result.available).length;
    return Math.round((availableCount / results.length) * 100);
  }

  generateHandleVariations(baseHandle: string): string[] {
    const variations = [baseHandle];
    
    // Add common variations
    if (baseHandle.length > 3) {
      variations.push(baseHandle + 'app');
      variations.push(baseHandle + 'hq');
      variations.push(baseHandle + 'official');
    }
    
    // Add with numbers
    variations.push(baseHandle + '2024');
    variations.push(baseHandle + '1');
    
    // Add with underscores
    if (!baseHandle.includes('_')) {
      variations.push(baseHandle + '_official');
    }
    
    return Array.from(new Set(variations)).slice(0, 5);
  }
}
