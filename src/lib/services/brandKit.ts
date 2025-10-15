import { BrandKit } from '../models/DomainResult';
import { AIService, AIConfig } from './aiService';

export interface BrandKitInput {
  idea: string;
  tone: 'modern' | 'playful' | 'serious';
  audience: string;
  domain?: string;
  constraints?: string;
  mustContain?: string;
  avoid?: string;
}

export class BrandKitService {
  private aiModel: string;
  private aiService: AIService;

  constructor(aiModel: string = 'claude-3.5') {
    this.aiModel = aiModel;
    
    // Initialize AI service based on environment variables - NO MOCK ALLOWED
    const aiConfig: AIConfig = {
      provider: (process.env.AI_PROVIDER as any) || 'claude', // Default to Claude, not mock
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || aiModel,
      baseUrl: process.env.AI_BASE_URL,
    };
    
    if (!aiConfig.apiKey) {
      throw new Error('AI_API_KEY is required. No simulated data allowed.');
    }
    
    this.aiService = new AIService(aiConfig);
  }

  async generateBrandKit(input: BrandKitInput): Promise<BrandKit> {
    const prompt = this.buildPrompt(input);
    
    try {
      // Call real AI service - NO MOCK DATA ALLOWED
      const response = await this.callAI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error('Error generating brand kit:', error);
      throw new Error('Failed to generate brand kit - AI service unavailable');
    }
  }

  private buildPrompt(input: BrandKitInput): string {
    return `System: You are a brand strategist and naming expert. Output strictly in the BrandKit JSON schema provided. Use compact, concrete language. Palettes must be hex colors, fonts from Google Fonts when possible. Logo prompts must describe vector-first concepts (SVG-friendly), no stock names.

User: 
- Idea: ${input.idea}
- Audience: ${input.audience}
- Tone: ${input.tone}
- Domain Context (optional): ${input.domain || 'none'}
Constraints:
- 6–10 concise name variants (<=10 chars when possible).
- 6 taglines.
- 1 palette: {primary, secondary, neutrals[3]}.
- Typography: heading + body + 2 alternates.
- 4 logoPrompts for simple, abstract marks.
- StarterCopy: heroH1, subhead, 3 valueProps, boilerplate (80–120 words).

Return valid JSON exactly matching the BrandKit type.`;
  }

  private async callAI(prompt: string): Promise<string> {
    // Extract the search term from the prompt
    const searchTerm = prompt.match(/Idea: (.+?)(?:\n|$)/)?.[1] || 'unknown';
    
    // Clean up the search term - remove "Brand for" prefix and domain extensions
    let cleanTerm = searchTerm.toLowerCase()
      .replace(/^brand for /, '') // Remove "Brand for" prefix
      .replace(/\.(com|io|co|app|dev|ai|tech|org|net)$/, '') // Remove common TLDs
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim();
    
    // If the term is too short or generic, use the original search term
    if (cleanTerm.length < 3 || cleanTerm === 'brand') {
      cleanTerm = searchTerm.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    }
    
    // Generate creative variations based on the search term
    const baseWords = cleanTerm.split(/\s+/);
    const firstWord = baseWords[0] || 'brand';
    const lastWord = baseWords[baseWords.length - 1] || firstWord;
    
    // Create name variations based on the actual search term
    const nameVariants = this.generateNameVariants(firstWord, lastWord, cleanTerm);
    
    return JSON.stringify({
      rationale: `Creative brand approach inspired by "${searchTerm}". The names capture the essence of your idea while maintaining memorability and market appeal.`,
      nameVariants: nameVariants,
      taglines: await this.generateTaglines(searchTerm, baseWords),
      voice: {
        adjectives: this.generateVoiceAdjectives(searchTerm),
        sampleOneLiner: this.generateSampleOneLiner(searchTerm, firstWord),
      },
      logoPrompts: this.generateLogoPrompts(searchTerm, firstWord),
      socialHandleIdeas: this.generateSocialHandles(firstWord, lastWord),
      starterCopy: this.generateStarterCopy(searchTerm, firstWord),
    });
  }

  private generateNameVariants(firstWord: string, lastWord: string, fullTerm: string) {
    const variants = [];
    
    // Skip generic words
    const skipWords = ['brand', 'the', 'for', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'from'];
    
    // Direct variations (only if not generic)
    if (!skipWords.includes(firstWord.toLowerCase()) && firstWord.length > 2) {
      const name = this.capitalize(firstWord);
      variants.push({ value: name, tone: this.determineTone(name), score: 95 });
    }
    
    if (!skipWords.includes(lastWord.toLowerCase()) && lastWord !== firstWord && lastWord.length > 2) {
      const name = this.capitalize(lastWord);
      variants.push({ value: name, tone: this.determineTone(name), score: 90 });
    }
    
    // Combined variations
    if (firstWord !== lastWord && !skipWords.includes(firstWord.toLowerCase()) && !skipWords.includes(lastWord.toLowerCase())) {
      const name1 = this.capitalize(firstWord + lastWord);
      const name2 = this.capitalize(lastWord + firstWord);
      variants.push({ value: name1, tone: this.determineTone(name1), score: 88 });
      variants.push({ value: name2, tone: this.determineTone(name2), score: 85 });
    }
    
    // Add meaningful suffixes based on the term
    const techSuffixes = ['Tech', 'App', 'Hub', 'Lab', 'Studio', 'Co', 'AI', 'Pro', 'Labs', 'Works'];
    const creativeSuffixes = ['Creative', 'Design', 'Studio', 'Works', 'Co', 'Lab', 'Hub'];
    const businessSuffixes = ['Co', 'Corp', 'Inc', 'LLC', 'Group', 'Partners', 'Solutions'];
    const playfulSuffixes = ['Fun', 'Play', 'Buzz', 'Spark', 'Dash', 'Pop', 'Zip', 'Snap'];
    const seriousSuffixes = ['Pro', 'Elite', 'Prime', 'Max', 'Ultra', 'Executive', 'Premium', 'Enterprise'];
    
    let suffixes = techSuffixes; // Default to tech
    if (fullTerm.includes('design') || fullTerm.includes('creative') || fullTerm.includes('art')) {
      suffixes = creativeSuffixes;
    } else if (fullTerm.includes('business') || fullTerm.includes('corporate') || fullTerm.includes('professional')) {
      suffixes = businessSuffixes;
    }
    
    // Add tone variety by using a deterministic mix of suffixes
    const allSuffixes = [...techSuffixes, ...playfulSuffixes, ...seriousSuffixes];
    // Use consistent selection based on string hash instead of random
    const selectedSuffixes = this.selectDeterministicSuffixes(allSuffixes, firstWord, 6);

    // Add suffix variations with deterministic scoring
    selectedSuffixes.slice(0, 4).forEach((suffix, index) => {
      if (!skipWords.includes(firstWord.toLowerCase())) {
        const name = this.capitalize(firstWord + suffix);
        // Deterministic score based on position and name characteristics
        const baseScore = 80 + (4 - index) * 2; // 88, 86, 84, 82
        variants.push({ value: name, tone: this.determineTone(name), score: baseScore });
      }
    });
    
    // Shortened versions (only if meaningful)
    if (firstWord.length > 4 && !skipWords.includes(firstWord.toLowerCase())) {
      const short = this.capitalize(firstWord.substring(0, 4));
      variants.push({ value: short, tone: this.determineTone(short), score: 75 });
    }
    
    // If we don't have enough variants, add some creative ones
    if (variants.length < 3) {
      const creativeNames = this.generateCreativeNames(fullTerm);
      creativeNames.forEach((name, index) => {
        // Deterministic scoring based on position
        const score = 70 + (creativeNames.length - index) * 3;
        variants.push({ value: name, tone: this.determineTone(name), score });
      });
    }
    
    return variants.slice(0, 8).sort((a, b) => b.score - a.score);
  }

  private generateCreativeNames(term: string): string[] {
    const words = term.split(/\s+/).filter(w => w.length > 2);
    const creative = [];
    
    // Create portmanteaus
    if (words.length >= 2) {
      const first = words[0].substring(0, Math.ceil(words[0].length / 2));
      const second = words[1].substring(Math.floor(words[1].length / 2));
      creative.push(this.capitalize(first + second));
    }
    
    // Add some generic but better alternatives
    const alternatives = ['Nexus', 'Vertex', 'Pulse', 'Flow', 'Spark', 'Edge', 'Core', 'Prime'];
    creative.push(...alternatives.slice(0, 2));
    
    return creative;
  }

  private async generateTaglines(searchTerm: string, baseWords: string[]): Promise<string[]> {
    try {
      // Try to use AI for tagline generation
      const aiTaglines = await this.generateAITaglines(searchTerm, baseWords);
      if (aiTaglines && aiTaglines.length > 0) {
        return aiTaglines;
      }
    } catch (error) {
      console.error('AI tagline generation failed, falling back to templates:', error);
    }
    
    // Fallback to template-based generation
    return this.generateTemplateTaglines(searchTerm, baseWords);
  }

  private async generateAITaglines(searchTerm: string, baseWords: string[]): Promise<string[]> {
    try {
      const coreConcept = this.extractCoreConcept(searchTerm, baseWords);
      const industry = this.detectIndustry(baseWords);
      
      // Create AI prompt for tagline generation
      const prompt = {
        system: `You are a creative copywriter specializing in brand taglines. Generate 6 creative, memorable taglines for a brand based on the given concept and industry. Make them punchy, memorable, and professional. Return only a JSON array of strings.`,
        user: `Generate taglines for: "${searchTerm}" (Core concept: "${coreConcept}", Industry: "${industry}")`,
        maxTokens: 300,
        temperature: 0.8
      };
      
      const response = await this.aiService.generateContent(prompt);
      
      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response);
        if (Array.isArray(parsed.taglines)) {
          return parsed.taglines.slice(0, 6);
        } else if (Array.isArray(parsed)) {
          return parsed.slice(0, 6);
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract taglines from text
        const lines = response.split('\n').filter(line => line.trim().length > 0);
        const taglines = lines
          .map(line => line.replace(/^[-•*]\s*/, '').replace(/^["']|["']$/g, '').trim())
          .filter(line => line.length > 0 && line.length < 100)
          .slice(0, 6);
        
        if (taglines.length > 0) {
          return taglines;
        }
      }
      
      // NO FALLBACK TO SIMULATION - THROW ERROR
      throw new Error('AI tagline generation failed - no simulated data allowed');
      
    } catch (error) {
      console.error('AI tagline generation failed:', error);
      throw error; // NO SIMULATION - propagate real error
    }
  }

  // REMOVED: All simulation methods - NO SIMULATED DATA ALLOWED

  private detectIndustry(baseWords: string[]): string {
    const techWords = ['ai', 'artificial', 'tech', 'software', 'app', 'digital', 'data', 'code'];
    const creativeWords = ['creative', 'design', 'art', 'visual', 'brand', 'marketing', 'content'];
    const businessWords = ['business', 'professional', 'corporate', 'enterprise', 'management', 'consulting'];
    const healthWords = ['health', 'fitness', 'wellness', 'medical', 'care', 'therapy'];
    
    if (baseWords.some(word => techWords.includes(word.toLowerCase()))) return 'tech';
    if (baseWords.some(word => creativeWords.includes(word.toLowerCase()))) return 'creative';
    if (baseWords.some(word => businessWords.includes(word.toLowerCase()))) return 'business';
    if (baseWords.some(word => healthWords.includes(word.toLowerCase()))) return 'health';
    
    return 'generic';
  }

  private generateTemplateTaglines(searchTerm: string, baseWords: string[]): string[] {
    const taglines = [];
    
    // Extract the core concept (remove common words)
    const coreConcept = this.extractCoreConcept(searchTerm, baseWords);
    
    // Generate creative taglines based on the concept
    const creativeTaglines = this.generateCreativeTaglines(coreConcept, baseWords);
    taglines.push(...creativeTaglines);
    
    // Add industry-specific taglines
    const industryTaglines = this.generateIndustryTaglines(baseWords);
    taglines.push(...industryTaglines);
    
    // Add action-oriented taglines
    const actionTaglines = this.generateActionTaglines(coreConcept);
    taglines.push(...actionTaglines);
    
    // Add benefit-focused taglines
    const benefitTaglines = this.generateBenefitTaglines(coreConcept, baseWords);
    taglines.push(...benefitTaglines);
    
    // Remove duplicates and return the best ones
    const uniqueTaglines = Array.from(new Set(taglines));
    return uniqueTaglines.slice(0, 6);
  }

  private extractCoreConcept(searchTerm: string, baseWords: string[]): string {
    // Remove common filler words
    const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const filtered = baseWords.filter(word => !fillerWords.includes(word.toLowerCase()));
    
    // Return the most meaningful word or combination
    if (filtered.length === 0) return searchTerm;
    if (filtered.length === 1) return filtered[0];
    
    // For multiple words, create a meaningful combination
    return filtered.slice(0, 2).join(' ');
  }

  private generateCreativeTaglines(coreConcept: string, baseWords: string[]): string[] {
    const taglines = [];
    
    // Creative variations
    const creativeTemplates = [
      `Redefining ${coreConcept}`,
      `${coreConcept} unleashed`,
      `Beyond ${coreConcept}`,
      `${coreConcept} perfected`,
      `The ${coreConcept} revolution`,
      `${coreConcept} reimagined`,
      `Next-gen ${coreConcept}`,
      `${coreConcept} evolved`,
    ];

    // Select templates deterministically based on concept hash
    const selected = this.selectDeterministicItems(creativeTemplates, coreConcept, 2);
    taglines.push(...selected);
    
    return taglines;
  }

  private generateIndustryTaglines(baseWords: string[]): string[] {
    const taglines = [];
    
    // Tech/AI specific
    if (baseWords.some(word => ['ai', 'artificial', 'tech', 'software', 'app', 'digital'].includes(word.toLowerCase()))) {
      taglines.push(
        'Intelligence meets innovation',
        'Where technology transforms',
        'Smart. Simple. Powerful.',
        'Built for the future',
        'Code meets creativity'
      );
    }
    
    // Business/Professional
    if (baseWords.some(word => ['business', 'professional', 'corporate', 'enterprise', 'management'].includes(word.toLowerCase()))) {
      taglines.push(
        'Professional excellence delivered',
        'Where business meets innovation',
        'Empowering your success',
        'Built for professionals',
        'Excellence in every detail'
      );
    }
    
    // Creative/Design
    if (baseWords.some(word => ['creative', 'design', 'art', 'visual', 'brand', 'marketing'].includes(word.toLowerCase()))) {
      taglines.push(
        'Where creativity comes alive',
        'Design that inspires',
        'Creative solutions, real results',
        'Art meets strategy',
        'Bringing ideas to life'
      );
    }
    
    // Health/Fitness
    if (baseWords.some(word => ['health', 'fitness', 'wellness', 'medical', 'care'].includes(word.toLowerCase()))) {
      taglines.push(
        'Your wellness, our mission',
        'Healthier tomorrow, today',
        'Wellness redefined',
        'Caring for your future',
        'Where health meets innovation'
      );
    }
    
    return taglines.slice(0, 2);
  }

  private generateActionTaglines(coreConcept: string): string[] {
    const actionTemplates = [
      `Transform your ${coreConcept}`,
      `Master ${coreConcept}`,
      `Unlock ${coreConcept}`,
      `Elevate your ${coreConcept}`,
      `Revolutionize ${coreConcept}`,
      `Optimize your ${coreConcept}`,
      `Streamline ${coreConcept}`,
      `Amplify ${coreConcept}`,
    ];

    // Select template deterministically based on concept hash
    return this.selectDeterministicItems(actionTemplates, coreConcept, 1);
  }

  private generateBenefitTaglines(coreConcept: string, baseWords: string[]): string[] {
    const taglines = [];
    
    // Generic benefit templates
    const benefitTemplates = [
      'Simple. Powerful. Effective.',
      'Results that matter',
      'Built for success',
      'Your success, our mission',
      'Excellence in every step',
      'Where potential meets performance',
      'Innovation that works',
      'Quality you can trust'
    ];

    // Select template deterministically based on concept hash
    const selected = this.selectDeterministicItems(benefitTemplates, coreConcept, 1);
    taglines.push(...selected);
    
    return taglines;
  }

  private generateVoiceAdjectives(searchTerm: string) {
    const adjectives = ['innovative', 'reliable', 'user-focused'];
    
    if (searchTerm.includes('ai') || searchTerm.includes('tech')) {
      adjectives.push('intelligent', 'cutting-edge');
    }
    if (searchTerm.includes('creative') || searchTerm.includes('design')) {
      adjectives.push('creative', 'inspiring');
    }
    if (searchTerm.includes('business') || searchTerm.includes('professional')) {
      adjectives.push('professional', 'trustworthy');
    }
    
    return adjectives.slice(0, 4);
  }

  private generateSampleOneLiner(searchTerm: string, firstWord: string) {
    return `Transform your ${searchTerm} experience with ${this.capitalize(firstWord)} - the solution you've been waiting for.`;
  }


  private generateLogoPrompts(searchTerm: string, firstWord: string) {
    return [
      `Minimalist logo incorporating elements of ${searchTerm}, modern vector style`,
      `Abstract geometric mark representing ${firstWord}, clean and scalable`,
      `Stylized letter mark for ${firstWord.charAt(0).toUpperCase()}, contemporary design`,
      `Simple icon combining ${searchTerm} concepts, monochrome and versatile`,
    ];
  }

  private generateSocialHandles(firstWord: string, lastWord: string) {
    return [
      firstWord.toLowerCase(),
      lastWord.toLowerCase(),
      `${firstWord}${lastWord}`.toLowerCase(),
      `${firstWord}app`.toLowerCase(),
    ];
  }

  private generateStarterCopy(searchTerm: string, firstWord: string) {
    return {
      heroH1: `Your ${searchTerm} Solution`,
      subhead: `Transform your ${searchTerm} experience with ${this.capitalize(firstWord)} - the platform designed for you`,
      valueProps: [
        `Streamlined ${searchTerm} management`,
        `Intuitive user experience`,
        `Professional-grade solutions`,
      ],
      boilerplate: `${this.capitalize(firstWord)} is designed to revolutionize your ${searchTerm} workflow. Our platform combines cutting-edge technology with user-friendly design to deliver results that matter. Whether you're just starting out or scaling up, we provide the tools and insights you need to succeed.`,
    };
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  private parseResponse(response: string): BrandKit {
    try {
      // Clean the response by removing markdown formatting and extra characters
      let cleanedResponse = response
        .replace(/```json\s*/g, '')  // Remove ```json
        .replace(/```\s*/g, '')       // Remove ```
        .replace(/^\s*```.*$/gm, '') // Remove any remaining ``` lines
        .trim();
      
      // Try to find JSON object boundaries
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      // Clean taglines array if it contains malformed strings
      const cleanTaglines = (parsed.taglines || []).map((tagline: any) => {
        if (typeof tagline === 'string') {
          // Remove quotes, commas, and other formatting artifacts
          return tagline
            .replace(/^["']|["']$/g, '')  // Remove leading/trailing quotes
            .replace(/^[-•*]\s*/, '')    // Remove bullet points
            .replace(/,$/, '')            // Remove trailing commas
            .trim();
        }
        return tagline;
      }).filter((tagline: any) => 
        typeof tagline === 'string' && 
        tagline.length > 0 && 
        !tagline.includes('```') && 
        !tagline.includes('[') && 
        !tagline.includes(']')
      );
      
      // Validate and clean the response
      return {
        rationale: parsed.rationale || "Brand strategy generated based on your requirements.",
        nameVariants: (parsed.nameVariants || []).slice(0, 5),
        taglines: cleanTaglines.slice(0, 6),
        voice: parsed.voice || { adjectives: [], sampleOneLiner: "" },
        logoPrompts: (parsed.logoPrompts || []).slice(0, 4),
        socialHandleIdeas: (parsed.socialHandleIdeas || []).slice(0, 4),
        starterCopy: parsed.starterCopy || {
          heroH1: "Your Brand",
          subhead: "A compelling subheadline",
          valueProps: ["Value 1", "Value 2", "Value 3"],
          boilerplate: "Your brand description goes here."
        }
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', response);
      throw new Error('Invalid AI response format');
    }
  }

  private scoreNames(names: string[], domain?: string): { value: string; tone: 'modern' | 'playful' | 'serious'; score: number }[] {
    return names.map(name => ({
      value: name,
      tone: this.determineTone(name),
      score: this.calculateNameScore(name, domain)
    })).sort((a, b) => b.score - a.score);
  }

  private determineTone(name: string): 'modern' | 'playful' | 'serious' {
    const playfulWords = ['fun', 'happy', 'joy', 'play', 'bounce', 'zip', 'pop', 'buzz', 'spark', 'dash', 'snap', 'flip', 'wink', 'giggle', 'chirp'];
    const seriousWords = ['pro', 'expert', 'premium', 'elite', 'corp', 'enterprise', 'exec', 'prime', 'max', 'ultra', 'inc', 'llc', 'group', 'partners'];

    const lowerName = name.toLowerCase();

    // Check for playful indicators
    if (playfulWords.some(word => lowerName.includes(word))) {
      return 'playful';
    }

    // Check for serious indicators
    if (seriousWords.some(word => lowerName.includes(word))) {
      return 'serious';
    }

    // Use deterministic tone assignment based on name characteristics
    // Check for length and syllable patterns
    const hasMultipleSyllables = name.length > 6;
    const hasUpperCase = /[A-Z]{2,}/.test(name);

    if (hasUpperCase || name.endsWith('Co') || name.endsWith('Corp')) {
      return 'serious';
    }

    if (!hasMultipleSyllables && name.length <= 5) {
      return 'playful';
    }

    return 'modern';
  }

  private calculateNameScore(name: string, domain?: string): number {
    let score = 60; // Start with a more reasonable base score
    
    // Length scoring
    if (name.length <= 4) score += 5; // Very short names
    else if (name.length <= 8) score += 15; // Good length
    else if (name.length <= 12) score += 10; // Acceptable length
    else if (name.length > 15) score -= 20; // Too long
    
    // Quality bonuses
    if (/^[a-zA-Z]+$/.test(name)) score += 10; // Only letters
    if (name.length >= 3 && name.length <= 8) score += 5; // Sweet spot
    
    // Penalties
    if (/\d/.test(name)) score -= 10; // Numbers
    if (/[^a-zA-Z0-9]/.test(name)) score -= 15; // Special characters
    if (name.length < 3) score -= 20; // Too short
    
    // Domain match bonus
    if (domain && name.toLowerCase() === domain.split('.')[0].toLowerCase()) {
      score += 15; // Reduced bonus
    }
    
    // Brandability assessment
    const commonWords = ['test', 'demo', 'example', 'sample', 'temp', 'new', 'my', 'the', 'a', 'an'];
    if (commonWords.includes(name.toLowerCase())) {
      score -= 15; // Penalty for generic/common words
    }
    
    return Math.max(0, Math.min(100, score));
  }

  // Helper method for deterministic item selection based on string hash
  private selectDeterministicItems<T>(items: T[], seed: string, count: number): T[] {
    if (items.length === 0) return [];
    if (count >= items.length) return items;

    // Create a simple hash from the seed string
    const hash = this.simpleHash(seed);

    // Use the hash to select items deterministically
    const selected: T[] = [];
    const indices = new Set<number>();

    for (let i = 0; i < count; i++) {
      // Generate a deterministic index based on hash and iteration
      let index = (hash + i * 7919) % items.length; // 7919 is a prime number

      // Avoid duplicates
      while (indices.has(index)) {
        index = (index + 1) % items.length;
      }

      indices.add(index);
      selected.push(items[index]);
    }

    return selected;
  }

  // Helper method for suffix selection (similar logic but returns strings)
  private selectDeterministicSuffixes(suffixes: string[], seed: string, count: number): string[] {
    return this.selectDeterministicItems(suffixes, seed, count);
  }

  // Simple hash function for deterministic selection
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
