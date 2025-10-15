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
    nameVariants: Array<{ value: string; score: number }>;
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
  /**
   * Calculate a unified composite score (0-100) that represents overall brand strength
   * Higher scores indicate better brand potential (availability, uniqueness, strength)
   */
  calculateCompositeScore(input: CompositeScoreInput): CompositeScoreResult {
    const weights = {
      domain: 0.25,    // 25% - Domain availability and quality (reduced from 35%)
      social: 0.20,    // 20% - Social media handle availability (reduced from 25%)
      trademark: 0.30, // 30% - Trademark risk (increased from 25% - most important)
      brand: 0.25      // 25% - Brand name quality (increased from 15% - very important)
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
        score = 90;
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

  private calculateBrandScore(brandKit?: CompositeScoreInput['brandKit']) {
    if (!brandKit || !brandKit.nameVariants.length) {
      return { score: 50, factors: ['No brand data available'] };
    }

    // Use the highest scoring name variant
    const bestVariant = brandKit.nameVariants.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    let score = bestVariant.score;
    const factors: string[] = [];

    // Name quality factors
    if (score >= 90) {
      factors.push('Excellent brand name quality');
    } else if (score >= 80) {
      factors.push('Good brand name quality');
    } else if (score >= 70) {
      factors.push('Fair brand name quality');
    } else {
      factors.push('Poor brand name quality');
    }

    // Length bonus
    if (bestVariant.value.length <= 8) {
      score += 5;
      factors.push('Short, memorable name');
    }

    // Character quality
    if (!/[^a-zA-Z]/.test(bestVariant.value)) {
      score += 5;
      factors.push('Clean, professional name');
    }

    return { score: Math.max(0, Math.min(100, score)), factors };
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

    if (brandScore.score >= 80) strengths.push('strong brand name');
    else if (brandScore.score < 50) weaknesses.push('weak brand name');

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

