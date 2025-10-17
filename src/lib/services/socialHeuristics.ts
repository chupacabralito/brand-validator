/**
 * Comprehensive Social Handle Heuristics Engine
 * Estimates handle availability using 20+ sophisticated rules
 */

// Data Sets
const COMMON_WORDS = new Set([
  // Common English words
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day',
  'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did',
  'its', 'let', 'put', 'say', 'she', 'too', 'use', 'dad', 'mom', 'car', 'dog', 'cat', 'run', 'top', 'hot',
  // Action/business words
  'app', 'web', 'net', 'dev', 'pro', 'hub', 'lab', 'box', 'bit', 'bay', 'shop', 'store', 'sale', 'deal',
  'buy', 'sell', 'save', 'free', 'best', 'cool', 'awesome', 'amazing', 'super', 'ultra', 'mega', 'epic',
  // Tech words
  'tech', 'code', 'hack', 'data', 'cloud', 'ai', 'ml', 'bot', 'api', 'sdk', 'app', 'web', 'digital',
  // Social/internet slang
  'lol', 'omg', 'btw', 'fyi', 'aka', 'bae', 'lit', 'fam', 'vibe', 'mood', 'flex', 'stan', 'simp', 'based'
]);

const COMMON_FIRST_NAMES = new Set([
  'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'charles',
  'mary', 'patricia', 'jennifer', 'linda', 'barbara', 'elizabeth', 'susan', 'jessica', 'sarah', 'karen',
  'alex', 'sam', 'chris', 'taylor', 'jordan', 'casey', 'riley', 'avery', 'quinn', 'reese'
]);

const COMMON_LAST_NAMES = new Set([
  'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez',
  'hernandez', 'lopez', 'gonzalez', 'wilson', 'anderson', 'thomas', 'taylor', 'moore', 'jackson', 'martin',
  'lee', 'walker', 'hall', 'allen', 'young', 'king', 'wright', 'scott', 'green', 'baker'
]);

const TECH_BRANDS = new Set([
  'google', 'apple', 'microsoft', 'amazon', 'facebook', 'meta', 'twitter', 'instagram', 'tiktok', 'youtube',
  'netflix', 'tesla', 'uber', 'airbnb', 'spotify', 'slack', 'zoom', 'discord', 'reddit', 'linkedin',
  'snapchat', 'pinterest', 'twitch', 'github', 'gitlab', 'docker', 'kubernetes', 'aws', 'azure', 'openai'
]);

const RESERVED_WORDS = new Set([
  'admin', 'root', 'support', 'help', 'api', 'mod', 'moderator', 'staff', 'team', 'official',
  'login', 'signup', 'register', 'delete', 'account', 'profile', 'settings', 'system', 'service',
  'info', 'contact', 'about', 'terms', 'privacy', 'legal', 'copyright', 'trademark', 'brand'
]);

const COMMON_PREFIXES = new Set([
  'the', 'real', 'official', 'get', 'use', 'my', 'your', 'our', 'new', 'best', 'top', 'pro', 'mr', 'ms', 'dr'
]);

const COMMON_SUFFIXES = new Set([
  'official', 'real', 'hq', 'app', 'io', 'ai', 'bot', 'dev', 'pro', 'plus', 'prime', 'max', 'ultra', 'tv', 'tv'
]);

const KEYBOARD_PATTERNS = [
  'qwerty', 'asdf', 'zxcv', 'qwer', 'asdfg', 'zxcvb', 'qaz', 'wsx', 'edc'
];

const GEO_TERMS = new Set([
  'nyc', 'la', 'sf', 'chicago', 'boston', 'miami', 'seattle', 'austin', 'denver', 'portland',
  'london', 'paris', 'tokyo', 'berlin', 'sydney', 'toronto', 'dubai', 'singapore', 'hongkong',
  'usa', 'uk', 'canada', 'australia', 'japan', 'france', 'germany', 'italy', 'spain', 'brazil'
]);

const PROFESSIONAL_TERMS = new Set([
  'ceo', 'cto', 'cfo', 'founder', 'entrepreneur', 'developer', 'designer', 'artist', 'writer', 'coach',
  'consultant', 'expert', 'specialist', 'professional', 'agency', 'studio', 'creative', 'digital',
  'marketing', 'business', 'startup', 'company', 'brand', 'media', 'content', 'influencer'
]);

interface HeuristicScore {
  available: boolean;
  confidence: number; // 0-100, how confident we are
  score: number; // 0-100, likelihood of being taken (100 = definitely taken)
  factors: string[]; // reasons for the assessment
}

export class SocialHandleHeuristics {
  /**
   * Main scoring function - evaluates handle across all heuristics
   */
  evaluateHandle(handle: string, platform: string): HeuristicScore {
    const factors: string[] = [];
    let takenScore = 0; // 0-100, higher = more likely taken

    const clean = handle.toLowerCase().trim();
    const length = clean.length;

    // Rule 1: Length Analysis (30% weight)
    const lengthScore = this.scoreLength(length);
    takenScore += lengthScore * 0.30;
    if (lengthScore > 80) factors.push(`Very short handle (${length} chars)`);
    else if (lengthScore < 20) factors.push(`Long handle (${length} chars)`);

    // Rule 2: Dictionary Words (20% weight)
    const dictScore = this.scoreDictionary(clean);
    takenScore += dictScore * 0.20;
    if (dictScore > 70) factors.push('Common dictionary word');

    // Rule 3: Name Patterns (15% weight)
    const nameScore = this.scoreNames(clean);
    takenScore += nameScore * 0.15;
    if (nameScore > 80) factors.push('Contains common name');

    // Rule 4: Brand Names (15% weight)
    const brandScore = this.scoreBrands(clean);
    takenScore += brandScore * 0.15;
    if (brandScore > 90) factors.push('Tech brand or company name');

    // Rule 5: Reserved Words (10% weight)
    const reservedScore = this.scoreReserved(clean);
    takenScore += reservedScore * 0.10;
    if (reservedScore > 95) factors.push('Reserved or system word');

    // Rule 6: Sequential Patterns (5% weight)
    const patternScore = this.scorePatterns(clean);
    takenScore += patternScore * 0.05;
    if (patternScore > 80) factors.push('Keyboard or sequential pattern');

    // Rule 7: Character Entropy (5% weight)
    const entropyScore = this.scoreEntropy(clean);
    takenScore += (100 - entropyScore) * 0.05; // Inverted: low entropy = more taken
    if (entropyScore > 80) factors.push('High randomness (gibberish)');

    // Rule 8: Affixes (5% weight)
    const affixScore = this.scoreAffixes(clean);
    takenScore += affixScore * 0.05;
    if (affixScore > 70) factors.push('Common prefix/suffix pattern');

    // Rule 9: Numbers & Special Chars (5% weight)
    const specialScore = this.scoreSpecialChars(clean);
    takenScore -= specialScore * 0.05; // Inverted: special chars = less taken
    if (specialScore > 50) factors.push('Contains numbers/underscores');

    // Rule 10: L33t Speak (5% weight)
    const leetScore = this.scoreLeetSpeak(clean);
    takenScore += leetScore * 0.05;
    if (leetScore > 70) factors.push('L33t speak or gaming style');

    // Rule 11: Geographic Terms (5% weight)
    const geoScore = this.scoreGeographic(clean);
    takenScore += geoScore * 0.05;
    if (geoScore > 80) factors.push('City or country name');

    // Rule 12: Professional Terms (5% weight)
    const profScore = this.scoreProfessional(clean);
    takenScore += profScore * 0.05;
    if (profScore > 70) factors.push('Professional or business term');

    // Rule 13: Pronounceability (5% weight)
    const pronounceScore = this.scorePronounceability(clean);
    takenScore += pronounceScore * 0.05;
    if (pronounceScore > 70) factors.push('Easy to pronounce/remember');

    // Rule 14: Repeating Characters (3% weight)
    const repeatScore = this.scoreRepeating(clean);
    takenScore += repeatScore * 0.03;
    if (repeatScore > 80) factors.push('Repeating pattern');

    // Rule 15: Platform-Specific Adjustment (7% weight)
    const platformMultiplier = this.getPlatformCompetitiveness(platform);
    takenScore *= platformMultiplier;

    // Clamp score between 0-100
    takenScore = Math.max(0, Math.min(100, takenScore));

    // Determine availability (threshold: 50)
    const available = takenScore < 50;

    // Calculate confidence based on how far from threshold
    const confidence = Math.min(100, Math.abs(50 - takenScore) * 2);

    // Add positive factors for available handles
    if (available) {
      if (length >= 10) factors.push('Good length for availability');
      if (specialScore > 30) factors.push('Unique character combination');
    }

    return {
      available,
      confidence: Math.round(confidence),
      score: Math.round(takenScore),
      factors: factors.slice(0, 3) // Top 3 factors
    };
  }

  private scoreLength(length: number): number {
    if (length <= 3) return 95; // Almost always taken
    if (length <= 4) return 85;
    if (length <= 5) return 70;
    if (length <= 6) return 55;
    if (length <= 7) return 40;
    if (length <= 9) return 25;
    if (length <= 12) return 15;
    return 5; // Very long, likely available
  }

  private scoreDictionary(handle: string): number {
    // Exact match
    if (COMMON_WORDS.has(handle)) return 85;

    // Contains common word
    for (const word of COMMON_WORDS) {
      if (handle.includes(word) && word.length >= 3) {
        return 60;
      }
    }

    return 0;
  }

  private scoreNames(handle: string): number {
    const lower = handle.toLowerCase();

    // Check first names
    if (COMMON_FIRST_NAMES.has(lower)) return 99;

    // Check last names
    if (COMMON_LAST_NAMES.has(lower)) return 95;

    // Check first+last combinations
    for (const first of COMMON_FIRST_NAMES) {
      for (const last of COMMON_LAST_NAMES) {
        if (lower === first + last || lower === first + '_' + last || lower === first + '.' + last) {
          return 80;
        }
      }
    }

    // Contains a common name
    for (const name of COMMON_FIRST_NAMES) {
      if (lower.includes(name) && name.length >= 4) {
        return 50;
      }
    }

    return 0;
  }

  private scoreBrands(handle: string): number {
    const lower = handle.toLowerCase();

    // Exact brand match
    if (TECH_BRANDS.has(lower)) return 100;

    // Contains brand name
    for (const brand of TECH_BRANDS) {
      if (lower.includes(brand)) {
        return 90;
      }
    }

    // Typo/variant of brand (basic check)
    for (const brand of TECH_BRANDS) {
      if (this.levenshteinDistance(lower, brand) <= 2 && brand.length >= 5) {
        return 85;
      }
    }

    return 0;
  }

  private scoreReserved(handle: string): number {
    if (RESERVED_WORDS.has(handle.toLowerCase())) return 100;
    return 0;
  }

  private scorePatterns(handle: string): number {
    const lower = handle.toLowerCase();

    // Keyboard patterns
    for (const pattern of KEYBOARD_PATTERNS) {
      if (lower.includes(pattern)) return 90;
    }

    // Number sequences
    if (/123|456|789|012|234|345|678|890/.test(lower)) return 85;

    // Sequential letters
    if (/abc|bcd|cde|def|xyz|wxy|vwx/.test(lower)) return 85;

    return 0;
  }

  private scoreEntropy(handle: string): number {
    // Shannon entropy calculation
    const freq: { [key: string]: number } = {};
    for (const char of handle) {
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    const len = handle.length;
    for (const count of Object.values(freq)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    // Normalize to 0-100 (max entropy for alphanumeric is ~5.17)
    return Math.min(100, (entropy / 5.17) * 100);
  }

  private scoreAffixes(handle: string): number {
    const lower = handle.toLowerCase();

    // Check prefixes
    for (const prefix of COMMON_PREFIXES) {
      if (lower.startsWith(prefix + '_') || lower.startsWith(prefix)) {
        return 75;
      }
    }

    // Check suffixes
    for (const suffix of COMMON_SUFFIXES) {
      if (lower.endsWith('_' + suffix) || lower.endsWith(suffix)) {
        return 75;
      }
    }

    // Year suffixes
    if (/_(19|20)\d{2}$|\d{4}$/.test(lower)) return 60;

    // Number suffixes
    if (/\d{1,3}$/.test(lower)) return 65;

    return 0;
  }

  private scoreSpecialChars(handle: string): number {
    let score = 0;

    // Has numbers
    if (/\d/.test(handle)) score += 30;

    // Has underscores
    if (/_/.test(handle)) score += 25;

    // Has multiple special chars
    const specialCount = (handle.match(/[_.-]/g) || []).length;
    score += Math.min(30, specialCount * 15);

    // Multiple numbers
    const numberCount = (handle.match(/\d/g) || []).length;
    if (numberCount >= 3) score += 20;

    return Math.min(100, score);
  }

  private scoreLeetSpeak(handle: string): number {
    // Common l33t patterns
    const leetPatterns = [
      /3/, // E
      /0/, // O
      /1/, // I or L
      /4/, // A
      /7/, // T
      /\$/,  // S
      /pr0/i,
      /n00b/i,
      /h4x/i,
      /pwn/i,
      /xXx/
    ];

    let matches = 0;
    for (const pattern of leetPatterns) {
      if (pattern.test(handle)) matches++;
    }

    return Math.min(100, matches * 20);
  }

  private scoreGeographic(handle: string): number {
    const lower = handle.toLowerCase();

    if (GEO_TERMS.has(lower)) return 95;

    for (const geo of GEO_TERMS) {
      if (lower.includes(geo)) return 70;
    }

    return 0;
  }

  private scoreProfessional(handle: string): number {
    const lower = handle.toLowerCase();

    if (PROFESSIONAL_TERMS.has(lower)) return 90;

    for (const term of PROFESSIONAL_TERMS) {
      if (lower.includes(term) && term.length >= 4) {
        return 65;
      }
    }

    return 0;
  }

  private scorePronounceability(handle: string): number {
    // Check vowel/consonant ratio
    const vowels = (handle.match(/[aeiou]/gi) || []).length;
    const consonants = (handle.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;
    const total = vowels + consonants;

    if (total === 0) return 0;

    const vowelRatio = vowels / total;

    // Ideal ratio is 0.3-0.5 (English-like)
    if (vowelRatio >= 0.3 && vowelRatio <= 0.5) {
      return 75; // Pronounceable = more likely taken
    }

    // Too many consonants or vowels = harder to pronounce
    return 30;
  }

  private scoreRepeating(handle: string): number {
    // Check for repeating characters
    if (/(.)\1{2,}/.test(handle)) return 85; // aaa, xxx, etc

    // Check for alternating patterns
    if (/^(..)+$/.test(handle) && handle.length <= 6) return 75; // abab, xyxy

    return 0;
  }

  private getPlatformCompetitiveness(platform: string): number {
    const lower = platform.toLowerCase();

    // Very competitive platforms
    if (['instagram', 'tiktok', 'twitter'].includes(lower)) {
      return 1.2; // 20% harder to get
    }

    // Moderately competitive
    if (['youtube', 'linkedin', 'facebook'].includes(lower)) {
      return 1.0; // Standard
    }

    // Less competitive
    if (['discord', 'pinterest', 'snapchat'].includes(lower)) {
      return 0.8; // 20% easier to get
    }

    return 1.0;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }
}
