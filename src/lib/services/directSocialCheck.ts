/**
 * Direct HTTP Social Handle Verification
 *
 * Layer 2 verification using direct HTTP checks to platform profile URLs.
 * This provides 70-80% accuracy for unclear cases where heuristics are uncertain.
 *
 * Features:
 * - Rate limit protection (max 10 requests/min across all platforms)
 * - 24-hour caching to prevent redundant checks
 * - Intelligent triggering (only checks when heuristics are uncertain)
 * - Respects platform rate limits to avoid IP bans
 */

interface DirectCheckResult {
  platform: string;
  handle: string;
  exists: boolean;
  confidence: number;
  method: 'http_check' | 'cached';
  checkedAt: string;
  statusCode?: number;
}

interface CacheEntry {
  result: DirectCheckResult;
  timestamp: number;
}

export class DirectSocialCheckService {
  private cache: Map<string, CacheEntry> = new Map();
  private requestLog: number[] = []; // Timestamps of recent requests
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_MINUTE = 10;

  /**
   * Platforms that CANNOT be reliably verified via HTTP status codes
   * These platforms return 200 for both existing and non-existing accounts
   * They require content parsing or API access instead
   */
  private readonly UNRELIABLE_HTTP_PLATFORMS = new Set([
    'instagram',  // Returns 200 with "Page isn't available" message
    'facebook',   // Returns 200 with error page
    'tiktok'      // Returns 200 or 403 inconsistently
  ]);

  /**
   * Platform URL patterns for direct HTTP checks
   * NOTE: Instagram, Facebook, TikTok excluded - see UNRELIABLE_HTTP_PLATFORMS
   */
  private platformUrls: Record<string, (handle: string) => string> = {
    twitter: (handle) => `https://twitter.com/${handle}`,
    youtube: (handle) => `https://www.youtube.com/@${handle}`,
    linkedin: (handle) => `https://www.linkedin.com/in/${handle}`,
    github: (handle) => `https://github.com/${handle}`,
    reddit: (handle) => `https://www.reddit.com/user/${handle}`,
    twitch: (handle) => `https://www.twitch.tv/${handle}`,
    medium: (handle) => `https://medium.com/@${handle}`
  };

  /**
   * Check if we're within rate limits
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    // Remove requests older than the window
    this.requestLog = this.requestLog.filter(timestamp => now - timestamp < this.RATE_LIMIT_WINDOW);

    return this.requestLog.length < this.MAX_REQUESTS_PER_MINUTE;
  }

  /**
   * Record a request for rate limiting
   */
  private recordRequest(): void {
    this.requestLog.push(Date.now());
  }

  /**
   * Get cache key
   */
  private getCacheKey(platform: string, handle: string): string {
    return `${platform}:${handle.toLowerCase()}`;
  }

  /**
   * Check if cached result is still valid
   */
  private getCachedResult(platform: string, handle: string): DirectCheckResult | null {
    const cacheKey = this.getCacheKey(platform, handle);
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return { ...cached.result, method: 'cached' };
    }

    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Cache a result
   */
  private cacheResult(platform: string, handle: string, result: DirectCheckResult): void {
    const cacheKey = this.getCacheKey(platform, handle);
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Perform direct HTTP check for a single platform
   *
   * @param platform Platform name (e.g., 'instagram', 'twitter')
   * @param handle Username to check
   * @param heuristicConfidence Confidence from heuristics (0-100)
   * @returns Direct check result or null if rate limited or unsupported platform
   */
  async checkHandle(
    platform: string,
    handle: string,
    heuristicConfidence: number
  ): Promise<DirectCheckResult | null> {
    // Skip platforms that cannot be reliably verified via HTTP
    if (this.UNRELIABLE_HTTP_PLATFORMS.has(platform.toLowerCase())) {
      console.log(`Skipping HTTP check for ${platform}/${handle} - platform requires content parsing (unreliable via HTTP status codes)`);
      return null;
    }

    // Only check if heuristics are uncertain (confidence < 85%)
    if (heuristicConfidence >= 85) {
      console.log(`Skipping HTTP check for ${platform}/${handle} - heuristics confident (${heuristicConfidence}%)`);
      return null;
    }

    // Check cache first
    const cached = this.getCachedResult(platform, handle);
    if (cached) {
      console.log(`Using cached result for ${platform}/${handle}`);
      return cached;
    }

    // Check if platform is supported
    const urlBuilder = this.platformUrls[platform.toLowerCase()];
    if (!urlBuilder) {
      console.log(`Platform ${platform} not supported for direct HTTP checks`);
      return null;
    }

    // Check rate limits
    if (!this.canMakeRequest()) {
      console.warn(`Rate limit exceeded - skipping HTTP check for ${platform}/${handle}`);
      return null;
    }

    // Perform HTTP check
    try {
      this.recordRequest();
      const url = urlBuilder(handle);

      const response = await fetch(url, {
        method: 'HEAD', // HEAD is faster and less bandwidth
        redirect: 'manual', // Don't follow redirects
        signal: AbortSignal.timeout(3000), // 3 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BrandValidator/1.0; +https://domainhunk.com)'
        }
      });

      const exists = this.interpretStatusCode(response.status, platform);
      const confidence = this.calculateConfidence(response.status, platform);

      const result: DirectCheckResult = {
        platform,
        handle,
        exists,
        confidence,
        method: 'http_check',
        checkedAt: new Date().toISOString(),
        statusCode: response.status
      };

      // Cache the result
      this.cacheResult(platform, handle, result);

      console.log(`HTTP check for ${platform}/${handle}: ${response.status} → ${exists ? 'EXISTS' : 'AVAILABLE'} (${confidence}% confidence)`);

      return result;
    } catch (error) {
      console.error(`HTTP check failed for ${platform}/${handle}:`, error);
      return null;
    }
  }

  /**
   * Interpret HTTP status code to determine if handle exists
   */
  private interpretStatusCode(statusCode: number, platform: string): boolean {
    // 200 = Profile page loaded = Handle exists/taken
    if (statusCode === 200) return true;

    // 404 = Not found = Handle potentially available
    // BUT: Could also mean banned, reserved, or in hold period
    if (statusCode === 404) return false;

    // 302/301 = Redirect
    // Instagram often redirects to login for existing accounts
    if (statusCode === 302 || statusCode === 301) {
      // Conservative: assume handle exists if redirecting
      return true;
    }

    // 403 = Forbidden (likely banned/suspended account)
    if (statusCode === 403) return true;

    // 429 = Rate limited (assume exists to be safe)
    if (statusCode === 429) return true;

    // Default: assume exists (conservative approach)
    return true;
  }

  /**
   * Calculate confidence based on status code and platform
   */
  private calculateConfidence(statusCode: number, platform: string): number {
    // 200 = High confidence handle exists
    if (statusCode === 200) return 90;

    // 404 = Medium-high confidence available
    // Lower for Instagram/TikTok due to banned/reserved handles
    if (statusCode === 404) {
      if (platform === 'instagram' || platform === 'tiktok') {
        return 70; // Could be banned/reserved
      }
      return 80; // Higher confidence for other platforms
    }

    // 302/301/403 = High confidence exists
    if ([301, 302, 403].includes(statusCode)) return 85;

    // 429 or other = Low confidence
    return 50;
  }

  /**
   * Batch check multiple platforms (respects rate limits)
   */
  async checkMultiplePlatforms(
    handle: string,
    platforms: Array<{ platform: string; heuristicConfidence: number }>
  ): Promise<DirectCheckResult[]> {
    const results: DirectCheckResult[] = [];

    // Filter to only uncertain platforms
    const uncertainPlatforms = platforms.filter(p => p.heuristicConfidence < 85);

    if (uncertainPlatforms.length === 0) {
      console.log(`All platforms have high heuristic confidence - skipping HTTP checks`);
      return results;
    }

    // Check how many requests we can make
    const availableSlots = this.MAX_REQUESTS_PER_MINUTE - this.requestLog.filter(
      timestamp => Date.now() - timestamp < this.RATE_LIMIT_WINDOW
    ).length;

    // Only check top N uncertain platforms based on available rate limit slots
    const platformsToCheck = uncertainPlatforms.slice(0, Math.min(availableSlots, 5));

    console.log(`Checking ${platformsToCheck.length}/${uncertainPlatforms.length} uncertain platforms (${availableSlots} rate limit slots available)`);

    // Check sequentially to respect rate limits
    for (const { platform, heuristicConfidence } of platformsToCheck) {
      const result = await this.checkHandle(platform, handle, heuristicConfidence);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; requests: number } {
    return {
      size: this.cache.size,
      requests: this.requestLog.length
    };
  }
}
