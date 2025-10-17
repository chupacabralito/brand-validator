import { SocialCheckResult, SocialHandleResult } from '../models/DomainResult';
import { SocialHandleHeuristics } from './socialHeuristics';

type SocialPlatform = "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "facebook" | "snapchat" | "pinterest" | "discord";

export class SocialService {
  private heuristics: SocialHandleHeuristics;

  constructor() {
    this.heuristics = new SocialHandleHeuristics();
  }

  async checkHandles(baseHandle: string): Promise<SocialCheckResult> {
    // Use heuristics for all platforms - fast and consistent
    const platforms = [
      this.checkPlatform(baseHandle, 'instagram'),
      this.checkPlatform(baseHandle, 'tiktok'),
      this.checkPlatform(baseHandle, 'twitter'),
      this.checkPlatform(baseHandle, 'youtube'),
      this.checkPlatform(baseHandle, 'linkedin'),
      this.checkPlatform(baseHandle, 'facebook'),
      this.checkPlatform(baseHandle, 'snapchat'),
      this.checkPlatform(baseHandle, 'pinterest'),
      this.checkPlatform(baseHandle, 'discord')
    ];

    const results: SocialHandleResult[] = platforms;
    const overallScore = this.calculateOverallScore(results);

    return {
      baseHandle,
      platforms: results,
      overallScore
    };
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
