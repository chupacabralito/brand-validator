import { SocialCheckResult, SocialHandleResult } from '../models/DomainResult';
import { SocialHandleHeuristics } from './socialHeuristics';
import { DirectSocialCheckService } from './directSocialCheck';

type SocialPlatform = "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "facebook" | "snapchat" | "pinterest" | "discord" | "threads" | "reddit" | "twitch" | "medium" | "github";

// Zyla API response interfaces
interface ZylaDebugInfo {
  status_code?: number;
  early_detection?: string;
  final_url?: string;
  is_available?: boolean;
}

interface ZylaSocialMedia {
  is_available: boolean;
  name: string;
  url: string;
  debug_info?: ZylaDebugInfo;
}

interface ZylaResponse {
  handle: string;
  social_media: ZylaSocialMedia[];
  status: number;
  success: boolean;
}

export class SocialService {
  private heuristics: SocialHandleHeuristics;
  private directCheck: DirectSocialCheckService;
  private zylaApiKey: string;

  constructor(zylaApiKey?: string) {
    this.heuristics = new SocialHandleHeuristics();
    this.directCheck = new DirectSocialCheckService();
    this.zylaApiKey = zylaApiKey || process.env.ZYLA_API_KEY || '';
  }

  async checkHandles(baseHandle: string): Promise<SocialCheckResult> {
    // Platforms verified by Zyla API (priority platforms)
    const zylaPlatforms: SocialPlatform[] = ['instagram', 'tiktok', 'facebook'];

    // Top-tier platforms using heuristics
    const heuristicPlatforms: SocialPlatform[] = ['twitter', 'youtube', 'linkedin', 'threads', 'reddit', 'twitch', 'medium', 'github'];

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

    // Layer 2: Direct HTTP checks for uncertain results (confidence < 85%)
    console.log('Running Layer 2: Direct HTTP verification for uncertain results...');
    const uncertainPlatforms = results
      .filter(r => (r.confidence || 0) < 85)
      .map(r => ({ platform: r.platform, heuristicConfidence: r.confidence || 50 }));

    if (uncertainPlatforms.length > 0) {
      const httpResults = await this.directCheck.checkMultiplePlatforms(baseHandle, uncertainPlatforms);

      // Merge HTTP results with heuristics (HTTP results override heuristics)
      for (const httpResult of httpResults) {
        const index = results.findIndex(r => r.platform === httpResult.platform);
        if (index !== -1 && results[index]) {
          const existingFactors = results[index].factors || [];
          // Update with HTTP check results
          results[index] = {
            ...results[index],
            available: !httpResult.exists,
            confidence: httpResult.confidence,
            factors: [
              `HTTP verification: ${httpResult.exists ? 'Exists' : 'Available'} (${httpResult.statusCode})`,
              ...existingFactors.slice(0, 1) // Keep one heuristic factor for context
            ]
          };
          console.log(`Updated ${httpResult.platform} with HTTP check: ${httpResult.exists ? 'TAKEN' : 'AVAILABLE'} (${httpResult.confidence}% confidence)`);
        }
      }
    }

    // Sort by platform order (priority platforms first)
    const platformOrder: SocialPlatform[] = ['instagram', 'tiktok', 'twitter', 'threads', 'youtube', 'linkedin', 'facebook', 'reddit', 'twitch', 'medium', 'github', 'snapchat', 'pinterest', 'discord'];
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

          // Check debug_info for reliability issues
          if (platformData.debug_info) {
            const statusCode = platformData.debug_info.status_code;
            const earlyDetection = platformData.debug_info.early_detection;

            // Reject rate-limited responses (429)
            if (statusCode === 429) {
              console.warn(`Zyla API ${platform} rate limited (429) - falling back to heuristics`);
              return null;
            }

            // Reject server errors (5xx)
            if (statusCode && statusCode >= 500) {
              console.warn(`Zyla API ${platform} server error (${statusCode}) - falling back to heuristics`);
              return null;
            }

            // CRITICAL: Reject ALL early detection heuristics
            // Any "early_detection" value means Zyla is GUESSING, not actually parsing account data
            // Early detection methods are fundamentally unreliable:
            // - "status_200_valid_url" - 200 doesn't mean account exists
            // - "redirected_to_login_account_exists" - login redirects are for privacy
            // - Other methods - also unreliable web scraping guesses
            // Only trust Zyla when it actually parses real account data (early_detection undefined/null)
            if (earlyDetection) {
              console.warn(`Zyla API ${platform} using unreliable early detection "${earlyDetection}" - falling back to our heuristics`);
              return null;
            }
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
    // Instagram, TikTok, Twitter, Threads use @
    if (['instagram', 'tiktok', 'twitter', 'threads'].includes(platform.toLowerCase())) {
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
      case 'threads':
        return `https://www.threads.net/@${cleanHandle}`;
      case 'youtube':
        return `https://www.youtube.com/@${cleanHandle}`;
      case 'linkedin':
        return `https://www.linkedin.com/in/${cleanHandle}`;
      case 'facebook':
        return `https://www.facebook.com/${cleanHandle}`;
      case 'reddit':
        return `https://www.reddit.com/user/${cleanHandle}`;
      case 'twitch':
        return `https://www.twitch.tv/${cleanHandle}`;
      case 'medium':
        return `https://medium.com/@${cleanHandle}`;
      case 'github':
        return `https://github.com/${cleanHandle}`;
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

  /**
   * Get registration/signup URL for each platform
   */
  getRegistrationUrl(platform: string): string {
    const normalized = platform.toLowerCase();

    switch (normalized) {
      case 'instagram':
        return 'https://www.instagram.com/accounts/emailsignup/';
      case 'tiktok':
        return 'https://www.tiktok.com/signup';
      case 'twitter':
        return 'https://twitter.com/i/flow/signup';
      case 'threads':
        return 'https://www.threads.net';
      case 'youtube':
        return 'https://www.youtube.com/create_channel';
      case 'linkedin':
        return 'https://www.linkedin.com/signup';
      case 'facebook':
        return 'https://www.facebook.com/reg/';
      case 'reddit':
        return 'https://www.reddit.com/register/';
      case 'twitch':
        return 'https://www.twitch.tv/signup';
      case 'medium':
        return 'https://medium.com/m/signin?operation=register';
      case 'github':
        return 'https://github.com/signup';
      case 'snapchat':
        return 'https://accounts.snapchat.com/accounts/signup';
      case 'pinterest':
        return 'https://www.pinterest.com/signup/';
      case 'discord':
        return 'https://discord.com/register';
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
