import { SocialCheckResult, SocialHandleResult } from '../models/DomainResult';

export class SocialService {
  async checkHandles(baseHandle: string): Promise<SocialCheckResult> {
    const platforms = await Promise.allSettled([
      this.checkInstagram(baseHandle),
      this.checkTikTok(baseHandle),
      this.checkTwitter(baseHandle),
      this.checkYouTube(baseHandle),
      this.checkLinkedIn(baseHandle),
      this.checkFacebook(baseHandle),
      this.checkSnapchat(baseHandle),
      this.checkPinterest(baseHandle),
      this.checkDiscord(baseHandle)
    ]);

    const results: SocialHandleResult[] = platforms
      .filter((result): result is PromiseFulfilledResult<SocialHandleResult> => result.status === 'fulfilled')
      .map(result => result.value);

    const overallScore = this.calculateOverallScore(results);

    return {
      baseHandle,
      platforms: results,
      overallScore
    };
  }

  private async checkInstagram(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://www.instagram.com/${handle}/`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'instagram',
        handle: `@${handle}`,
        available: response.status === 404,
        url: `https://www.instagram.com/${handle}/`
      };
    } catch (error) {
      // If check fails, use heuristic: shorter handles more likely taken
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'instagram',
        handle: `@${handle}`,
        available: heuristicAvailable,
        url: `https://www.instagram.com/${handle}/`
      };
    }
  }

  private async checkTikTok(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://www.tiktok.com/@${handle}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'tiktok',
        handle: `@${handle}`,
        available: response.status === 404,
        url: `https://www.tiktok.com/@${handle}`
      };
    } catch (error) {
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'tiktok',
        handle: `@${handle}`,
        available: heuristicAvailable,
        url: `https://www.tiktok.com/@${handle}`
      };
    }
  }

  private async checkTwitter(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://twitter.com/${handle}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'twitter',
        handle: `@${handle}`,
        available: response.status === 404,
        url: `https://twitter.com/${handle}`
      };
    } catch (error) {
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'twitter',
        handle: `@${handle}`,
        available: heuristicAvailable,
        url: `https://twitter.com/${handle}`
      };
    }
  }

  private async checkYouTube(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://www.youtube.com/@${handle}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'youtube',
        handle: `@${handle}`,
        available: response.status === 404,
        url: `https://www.youtube.com/@${handle}`
      };
    } catch (error) {
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'youtube',
        handle: `@${handle}`,
        available: heuristicAvailable,
        url: `https://www.youtube.com/@${handle}`
      };
    }
  }

  private async checkLinkedIn(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://www.linkedin.com/in/${handle}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'linkedin',
        handle: handle,
        available: response.status === 404,
        url: `https://www.linkedin.com/in/${handle}`
      };
    } catch (error) {
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'linkedin',
        handle: handle,
        available: heuristicAvailable,
        url: `https://www.linkedin.com/in/${handle}`
      };
    }
  }

  private async checkFacebook(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://www.facebook.com/${handle}/`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'facebook',
        handle,
        available: response.status === 404,
        url: `https://facebook.com/${handle}`
      };
    } catch (error) {
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'facebook',
        handle,
        available: heuristicAvailable,
        url: `https://facebook.com/${handle}`
      };
    }
  }

  private async checkSnapchat(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://www.snapchat.com/add/${handle}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'snapchat',
        handle,
        available: response.status === 404,
        url: `https://snapchat.com/add/${handle}`
      };
    } catch (error) {
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'snapchat',
        handle,
        available: heuristicAvailable,
        url: `https://snapchat.com/add/${handle}`
      };
    }
  }

  private async checkPinterest(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://www.pinterest.com/${handle}/`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'pinterest',
        handle,
        available: response.status === 404,
        url: `https://pinterest.com/${handle}`
      };
    } catch (error) {
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'pinterest',
        handle,
        available: heuristicAvailable,
        url: `https://pinterest.com/${handle}`
      };
    }
  }

  private async checkDiscord(handle: string): Promise<SocialHandleResult> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://discord.gg/${handle}`, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      clearTimeout(timeout);

      return {
        platform: 'discord',
        handle,
        available: response.status === 404,
        url: `https://discord.gg/${handle}`
      };
    } catch (error) {
      const heuristicAvailable = this.estimateAvailability(handle);
      return {
        platform: 'discord',
        handle,
        available: heuristicAvailable,
        url: `https://discord.gg/${handle}`
      };
    }
  }

  private estimateAvailability(handle: string): boolean {
    // Heuristic for estimating availability when API checks fail
    // Shorter handles and common words are more likely taken
    const commonWords = ['app', 'official', 'team', 'real', 'admin', 'help', 'support', 'shop', 'store'];
    const lowerHandle = handle.toLowerCase();

    // Very short handles (1-3 chars) are almost always taken
    if (handle.length <= 3) return false;

    // Common words are likely taken
    if (commonWords.includes(lowerHandle)) return false;

    // Handles with numbers or underscores more likely available
    if (/\d/.test(handle) || /_/.test(handle)) return true;

    // Longer handles (10+) more likely available
    if (handle.length >= 10) return true;

    // Medium length (4-9) - use length-based probability
    // Shorter within this range = less likely available
    return handle.length >= 7;
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
