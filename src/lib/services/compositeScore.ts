export interface CompositeScoreInput {
  domainResult?: {
    available: boolean;
    query: string;
    alternates: Array<{ domain: string; available: boolean; score: number }>;
  };
  socialResult?: {
    overallScore: number;
    platforms: Array<{ available: boolean; platform: string }>;
  };
  trademarkResult?: {
    riskAssessment: {
      overallRisk: 'low' | 'medium' | 'high';
      riskFactors: string[];
    };
    exactMatches: any[];
    similarMatches: any[];
  };
  brandKit?: {
    brandName: string;
    nameVariants?: Array<{ value: string; score: number }>; // Legacy field
    tones?: any; // New structure
  };
  selectedTrademarkCategory?: string;
}

export interface CompositeScoreResult {
  overallScore: number; // 0-100
  breakdown: {
    domain: {
      score: number;
      weight: number;
      factors: string[];
    };
    social: {
      score: number;
      weight: number;
      factors: string[];
    };
    trademark: {
      score: number;
      weight: number;
      factors: string[];
    };
    brand: {
      score: number;
      weight: number;
      factors: string[];
    };
  };
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  summary: string;
}

export class CompositeScoreService {
  // Cache for LLM brand quality scores with reasoning (in-memory, could be Redis in production)
  private static brandQualityCache = new Map<string, { score: number; reasoning: string }>();

  /**
   * Calculate a unified composite score (0-100) that represents overall brand strength
   * Higher scores indicate better brand potential (availability, uniqueness, strength)
   * This is the synchronous version using heuristics only
   */
  calculateCompositeScore(input: CompositeScoreInput): CompositeScoreResult {
    const weights = {
      domain: 0.33,    // 33% - Domain availability and quality
      social: 0.27,    // 27% - Social media handle availability
      trademark: 0.40, // 40% - Trademark risk (most important)
      brand: 0.00      // 0% - Brand Kit excluded from composite score per user requirement
    };

    const domainScore = this.calculateDomainScore(input.domainResult);
    const socialScore = this.calculateSocialScore(input.socialResult);
    const trademarkScore = this.calculateTrademarkScore(input.trademarkResult, input.selectedTrademarkCategory);
    const brandScore = this.calculateBrandScore(input.brandKit);

    const overallScore = Math.round(
      (domainScore.score * weights.domain) +
      (socialScore.score * weights.social) +
      (trademarkScore.score * weights.trademark) +
      (brandScore.score * weights.brand)
    );

    const recommendation = this.getRecommendation(overallScore);
    const summary = this.generateSummary(overallScore, domainScore, socialScore, trademarkScore, brandScore);

    return {
      overallScore,
      breakdown: {
        domain: { ...domainScore, weight: weights.domain },
        social: { ...socialScore, weight: weights.social },
        trademark: { ...trademarkScore, weight: weights.trademark },
        brand: { ...brandScore, weight: weights.brand }
      },
      recommendation,
      summary
    };
  }

  /**
   * Async version that uses LLM for enhanced brand quality evaluation
   * Recommended for production use - much more accurate than heuristics
   */
  async calculateCompositeScoreWithLLM(input: CompositeScoreInput): Promise<CompositeScoreResult> {
    const weights = {
      domain: 0.25,
      social: 0.20,
      trademark: 0.30,
      brand: 0.25
    };

    const domainScore = this.calculateDomainScore(input.domainResult);
    const socialScore = this.calculateSocialScore(input.socialResult);
    const trademarkScore = this.calculateTrademarkScore(input.trademarkResult, input.selectedTrademarkCategory);
    const brandScore = await this.calculateBrandScoreWithLLM(input.brandKit); // LLM-enhanced

    const overallScore = Math.round(
      (domainScore.score * weights.domain) +
      (socialScore.score * weights.social) +
      (trademarkScore.score * weights.trademark) +
      (brandScore.score * weights.brand)
    );

    const recommendation = this.getRecommendation(overallScore);
    const summary = this.generateSummary(overallScore, domainScore, socialScore, trademarkScore, brandScore);

    return {
      overallScore,
      breakdown: {
        domain: { ...domainScore, weight: weights.domain },
        social: { ...socialScore, weight: weights.social },
        trademark: { ...trademarkScore, weight: weights.trademark },
        brand: { ...brandScore, weight: weights.brand }
      },
      recommendation,
      summary
    };
  }

  private calculateDomainScore(domainResult?: CompositeScoreInput['domainResult']) {
    if (!domainResult) {
      return { score: 0, factors: ['No domain data available'] };
    }

    let score = 0;
    const factors: string[] = [];

    // Primary domain availability (40 points) - More flexible approach
    if (domainResult.available) {
      score += 40;
      factors.push('Primary domain available');
    } else if (domainResult.alternates && domainResult.alternates.some(alt => alt.available)) {
      // Give partial credit for alternative TLDs
      const availableAlternates = domainResult.alternates.filter(alt => alt.available);
      score += 30;
      factors.push(`${availableAlternates.length} alternative TLDs available`);
    } else {
      factors.push('No domain options available');
    }

    // TLD quality (20 points) - Accept modern TLDs as premium
    const tld = domainResult.query?.split('.').pop()?.toLowerCase();
    if (tld === 'com') {
      score += 20;
      factors.push('Premium .com domain');
    } else if (['io', 'co', 'ai', 'app', 'dev'].includes(tld || '')) {
      score += 18; // Almost as good as .com for modern startups
      factors.push('Modern premium TLD');
    } else {
      score += 10;
      factors.push('Standard TLD');
    }

    // Domain length and quality (20 points)
    const domainLength = domainResult.query.length;
    if (domainLength <= 8) {
      score += 20;
      factors.push('Short, memorable domain');
    } else if (domainLength <= 12) {
      score += 15;
      factors.push('Good domain length');
    } else if (domainLength <= 15) {
      score += 10;
      factors.push('Acceptable domain length');
    } else {
      factors.push('Long domain name');
    }

    // Hyphen penalty
    if (domainResult.query.includes('-')) {
      score -= 10;
      factors.push('Contains hyphens (less professional)');
    }

    // Alternative domains (20 points) - Enhanced scoring
    const availableAlternates = domainResult.alternates.filter(alt => alt.available);
    if (availableAlternates.length >= 3) {
      score += 20;
      factors.push('Multiple domain alternatives available');
    } else if (availableAlternates.length >= 1) {
      score += 10;
      factors.push('Some domain alternatives available');
    } else {
      factors.push('No domain alternatives available');
    }

    // Bonus for modern TLD alternatives (NEW)
    const modernTlds = ['io', 'co', 'ai', 'app', 'dev'];
    const modernAlternates = availableAlternates.filter(alt => 
      modernTlds.some(tld => alt.domain.endsWith('.' + tld))
    );
    if (modernAlternates.length > 0) {
      score += 10;
      factors.push(`${modernAlternates.length} modern TLD alternatives available`);
    }

    return { score: Math.max(0, Math.min(100, score)), factors };
  }

  private calculateSocialScore(socialResult?: CompositeScoreInput['socialResult']) {
    if (!socialResult) {
      return { score: 0, factors: ['No social media data available'] };
    }

    const availablePlatforms = socialResult.platforms.filter(p => p.available);
    const totalPlatforms = socialResult.platforms.length;
    const availabilityRatio = totalPlatforms > 0 ? availablePlatforms.length / totalPlatforms : 0;

    let score = Math.round(availabilityRatio * 100);
    const factors: string[] = [];

    // Base availability score
    if (availabilityRatio >= 0.8) {
      factors.push('Most social handles available');
    } else if (availabilityRatio >= 0.6) {
      factors.push('Many social handles available');
    } else if (availabilityRatio >= 0.4) {
      factors.push('Some social handles available');
    } else {
      factors.push('Few social handles available');
    }

    // Platform-specific bonuses
    const keyPlatforms = ['instagram', 'twitter', 'tiktok', 'youtube'];
    const keyPlatformsAvailable = socialResult.platforms.filter(p => 
      keyPlatforms.includes(p.platform) && p.available
    ).length;

    if (keyPlatformsAvailable >= 3) {
      score += 10;
      factors.push('Key platforms available');
    }

    return { score: Math.max(0, Math.min(100, score)), factors };
  }

  private calculateTrademarkScore(trademarkResult?: CompositeScoreInput['trademarkResult'], selectedCategory?: string) {
    if (!trademarkResult) {
      return { score: 50, factors: ['No trademark data available'] };
    }

    // Debug logging
    console.log('Trademark Score Calculation:', {
      overallRisk: trademarkResult.riskAssessment.overallRisk,
      exactMatches: trademarkResult.exactMatches.length,
      similarMatches: trademarkResult.similarMatches.length,
      riskFactors: trademarkResult.riskAssessment.riskFactors,
      selectedCategory
    });

    let score = 100;
    const factors: string[] = [];

    // Risk-based scoring (inverted - lower risk = higher score)
    switch (trademarkResult.riskAssessment.overallRisk) {
      case 'low':
        score = 100; // Perfect score for low risk - no artificial cap
        factors.push('Low trademark risk');
        break;
      case 'medium':
        score = 60;
        factors.push('Medium trademark risk');
        break;
      case 'high':
        score = 20;
        factors.push('High trademark risk');
        break;
    }

    // Apply category-specific adjustments
    if (selectedCategory && selectedCategory !== 'all') {
      if (selectedCategory === 'Apparel & Fashion') {
        score = Math.max(score - 20, 10); // Fashion is highly competitive
        factors.push('High competition in fashion industry');
      } else if (selectedCategory === 'Health & Wellness') {
        score = Math.max(score - 15, 15); // Health has regulatory risks
        factors.push('Regulated health industry');
      } else if (selectedCategory === 'Technology & Software') {
        score = Math.max(score - 10, 25); // Tech has moderate competition
        factors.push('Competitive tech industry');
      }
    }

    // Exact matches penalty
    if (trademarkResult.exactMatches.length > 0) {
      score -= 30;
      factors.push(`${trademarkResult.exactMatches.length} exact trademark matches`);
    }

    // Similar matches penalty
    if (trademarkResult.similarMatches.length > 0) {
      score -= 15;
      factors.push(`${trademarkResult.similarMatches.length} similar trademark matches`);
    }

    // Risk factors penalty
    const riskFactorCount = trademarkResult.riskAssessment.riskFactors.length;
    if (riskFactorCount > 0) {
      score -= riskFactorCount * 5;
      factors.push(`${riskFactorCount} risk factors identified`);
    }

    return { score: Math.max(0, Math.min(100, score)), factors };
  }

  /**
   * Use LLM to evaluate brand name quality
   * Cached to minimize API costs
   * Returns both score and reasoning to explain the score
   */
  private async evaluateBrandNameWithLLM(brandName: string): Promise<{ score: number; reasoning: string }> {
    // Check cache first
    const cached = CompositeScoreService.brandQualityCache.get(brandName.toLowerCase());
    if (cached !== undefined) {
      console.log(`Brand quality cache hit for "${brandName}": ${cached.score} - ${cached.reasoning}`);
      return cached;
    }

    // Import AI service dynamically to avoid circular dependencies
    const { AIService } = await import('./aiService');

    const aiService = new AIService({
      provider: (process.env.AI_PROVIDER as any) || 'openai',
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || 'gpt-4o-mini'
    });

    try {
      const response = await aiService.generateContent({
        system: `You are a brand naming expert. Evaluate brand names on a scale of 0-100.

CRITICAL: First check if this is an EXISTING well-known brand. If yes, score 0-20 based on prominence:

**0-5: Global mega-brands** (Impossible to use - immediate legal risk)
- Examples: Google (2), Apple (3), Amazon (4), Microsoft (2), Facebook/Meta (3), Nike (4), Coca-Cola (2), McDonald's (1), Disney (2), Samsung (3)
- Reason: "Existing global mega-brand - impossible to use legally"

**6-10: Well-known established brands** (Strong trademark protection)
- Examples: Spotify (8), Airbnb (7), Slack (9), Uber (7), Netflix (8), Reddit (9), Snapchat (8), Dropbox (7), Tesla (5)
- Reason: "Existing well-known brand - high legal risk"

**11-15: Regional or niche brands** (Moderate risk)
- Smaller companies, local brands, industry-specific names
- Reason: "Existing regional/niche brand - moderate legal risk"

**16-20: Defunct or weakly protected brands** (Lower risk but still problematic)
- Examples: Blockbuster (18), Vine (17), MySpace (19), RadioShack (18)
- Reason: "Defunct brand - lower risk but still trademarked"

If NOT an existing brand, score 30-100 based on linguistic quality:

**90-100: Excellent** (Invented words, highly brandable)
- Examples: Zendesk (95), Figma (92), Canva (94), Duolingo (93)
- Consider: pronounceability, memorability, uniqueness, professionalism

**70-89: Good** (Strong names with minor issues)
- Examples: TechFlow (82), BrandKit (78), SocialHub (75)
- May be slightly generic or descriptive

**50-69: Fair** (Acceptable but unremarkable)
- Generic terms, common patterns, somewhat forgettable

**30-49: Poor** (Gibberish, keyboard smash, hard to pronounce)
- Examples: qwerty (35), ioiubbbb (32), xXxGamerxXx (40)

Return ONLY in this format:
SCORE: [number]
REASON: [one sentence explanation]`,
        user: `Brand name: "${brandName}"`,
        maxTokens: 100,
        temperature: 0.3 // Low temperature for consistent scoring
      });

      // Parse response
      const scoreMatch = response.match(/SCORE:\s*(\d+)/);
      const reasonMatch = response.match(/REASON:\s*(.+)/);

      if (!scoreMatch || !reasonMatch) {
        console.error(`Failed to parse LLM response for "${brandName}": ${response}`);
        return {
          score: this.calculateHeuristicBrandScore(brandName),
          reasoning: 'AI evaluation unavailable, using heuristic scoring'
        };
      }

      const score = parseInt(scoreMatch[1]);
      const reasoning = reasonMatch[1].trim();

      // Validate score
      if (isNaN(score) || score < 0 || score > 100) {
        console.error(`Invalid LLM score for "${brandName}": ${score}`);
        return {
          score: this.calculateHeuristicBrandScore(brandName),
          reasoning: 'Invalid AI score, using heuristic'
        };
      }

      // Cache the result
      const result = { score, reasoning };
      CompositeScoreService.brandQualityCache.set(brandName.toLowerCase(), result);
      console.log(`LLM brand quality for "${brandName}": ${score} - ${reasoning}`);

      return result;
    } catch (error) {
      console.error(`LLM brand evaluation failed for "${brandName}":`, error);
      // Fallback to heuristic if LLM fails
      return {
        score: this.calculateHeuristicBrandScore(brandName),
        reasoning: 'AI service unavailable, using heuristic scoring'
      };
    }
  }

  /**
   * Fallback heuristic scoring (used if LLM fails)
   */
  private calculateHeuristicBrandScore(brandName: string): number {
    let score = 75;

    // Length
    if (brandName.length <= 6) score = 95;
    else if (brandName.length <= 8) score = 85;
    else if (brandName.length <= 12) score = 75;
    else score = 60;

    // Excessive repetition penalty
    if (/(.)\1{2,}/.test(brandName)) {
      score -= 25;
    }

    // Vowel ratio (pronounceability)
    const vowels = (brandName.match(/[aeiou]/gi) || []).length;
    const vowelRatio = vowels / brandName.length;
    if (vowelRatio < 0.2 || vowelRatio > 0.7) {
      score -= 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateBrandScore(brandKit?: CompositeScoreInput['brandKit']) {
    if (!brandKit) {
      return { score: 50, factors: ['No brand data available'] };
    }

    // Handle new BrandKit structure (with tones) vs old structure (with nameVariants)
    let brandName: string;
    let score = 75; // Default base score
    const factors: string[] = [];

    if (brandKit.nameVariants && brandKit.nameVariants.length > 0) {
      // Legacy structure with nameVariants
      const bestVariant = brandKit.nameVariants.reduce((best, current) =>
        current.score > best.score ? current : best
      );
      brandName = bestVariant.value;
      score = bestVariant.score;
    } else if (brandKit.brandName) {
      // New structure with brandName and tones
      brandName = brandKit.brandName;

      // Use heuristic as fallback (will be enhanced by LLM in async version)
      score = this.calculateHeuristicBrandScore(brandName);

      const length = brandName.length;
      if (length <= 6) {
        factors.push('Very short name');
      } else if (length <= 8) {
        factors.push('Short name');
      } else if (length <= 12) {
        factors.push('Moderate length');
      } else {
        factors.push('Longer name');
      }

      if (!/[^a-zA-Z]/.test(brandName)) {
        factors.push('Clean characters');
      }
    } else {
      return { score: 50, factors: ['Invalid brand data structure'] };
    }

    // Name quality factors
    if (score >= 90) {
      if (!factors.some(f => f.includes('quality'))) {
        factors.push('Excellent brand quality');
      }
    } else if (score >= 70) {
      if (!factors.some(f => f.includes('quality'))) {
        factors.push('Good brand quality');
      }
    } else if (score >= 50) {
      if (!factors.some(f => f.includes('quality'))) {
        factors.push('Fair brand quality');
      }
    } else {
      if (!factors.some(f => f.includes('quality'))) {
        factors.push('Poor brand quality');
      }
    }

    return { score: Math.max(0, Math.min(100, score)), factors };
  }

  /**
   * Async version that uses LLM for brand quality
   */
  async calculateBrandScoreWithLLM(brandKit?: CompositeScoreInput['brandKit']) {
    if (!brandKit || !brandKit.brandName) {
      return this.calculateBrandScore(brandKit);
    }

    const brandName = brandKit.brandName;
    const factors: string[] = [];

    // Get LLM score and reasoning
    const { score, reasoning } = await this.evaluateBrandNameWithLLM(brandName);

    // Add the AI reasoning as the primary factor
    factors.push(reasoning);

    // Add contextual interpretation based on score and reasoning
    const isExistingBrand = reasoning.toLowerCase().includes('existing') ||
                           reasoning.toLowerCase().includes('mega-brand') ||
                           reasoning.toLowerCase().includes('well-known brand');

    if (score >= 90) {
      factors.push('Highly brandable name with strong market potential');
    } else if (score >= 70) {
      factors.push('Solid brand name with good commercial viability');
    } else if (score >= 50) {
      factors.push('Acceptable brand name but may face recognition challenges');
    } else if (isExistingBrand) {
      // Low score due to existing brand - clarify this is about availability, not quality
      factors.push('Cannot be used due to existing trademark ownership');
    } else {
      // Actually a weak name quality
      factors.push('Poor linguistic quality - consider alternative names');
    }

    // Add length context only if it's relevant (not for existing brands)
    if (!isExistingBrand) {
      const length = brandName.length;
      if (length <= 6) {
        factors.push('Very short - memorable and easy to type');
      } else if (length > 15) {
        factors.push('Long name - may reduce memorability');
      }
    }

    return { score, factors };
  }

  private getRecommendation(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private generateSummary(
    overallScore: number,
    domainScore: any,
    socialScore: any,
    trademarkScore: any,
    brandScore: any
  ): string {
    const recommendation = this.getRecommendation(overallScore);

    const strengths = [];
    const weaknesses = [];

    if (domainScore.score >= 80) strengths.push('strong domain availability');
    else if (domainScore.score < 50) weaknesses.push('limited domain options');

    if (socialScore.score >= 80) strengths.push('good social media presence');
    else if (socialScore.score < 50) weaknesses.push('limited social media availability');

    if (trademarkScore.score >= 80) strengths.push('low trademark risk');
    else if (trademarkScore.score < 50) weaknesses.push('high trademark risk');

    // Brand name handling - check reasoning to differentiate existing brands from weak names
    const brandReasoning = brandScore.factors?.[0] || '';
    const isExistingBrand = brandReasoning.toLowerCase().includes('existing') ||
                           brandReasoning.toLowerCase().includes('mega-brand') ||
                           brandReasoning.toLowerCase().includes('well-known brand');

    if (brandScore.score >= 80) {
      strengths.push('strong brand name');
    } else if (brandScore.score < 50) {
      // Differentiate between existing strong brands vs actually weak names
      if (isExistingBrand) {
        weaknesses.push('name already used by existing brand (unavailable)');
      } else {
        weaknesses.push('weak brand name quality');
      }
    }

    let summary = `Overall brand strength: ${overallScore}/100 (${recommendation}). `;

    if (strengths.length > 0) {
      summary += `Strengths: ${strengths.join(', ')}. `;
    }

    if (weaknesses.length > 0) {
      summary += `Areas for improvement: ${weaknesses.join(', ')}.`;
    }

    return summary;
  }
}

