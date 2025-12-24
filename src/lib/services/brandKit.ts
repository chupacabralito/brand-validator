import { BrandKit, BrandTone, ToneCreative } from '../models/DomainResult';
import { AIService, AIConfig } from './aiService';

export interface BrandKitInput {
  idea: string;
  tone?: BrandTone;
  audience?: string;
  domain?: string;
}

interface BrandAnalysis {
  meaning: string;
  industry: string;
  emotions: string[];
  visualMetaphors: string[];
}

export class BrandKitService {
  private aiService: AIService;
  private analysisCache: Map<string, BrandAnalysis> = new Map();

  constructor(aiModel: string = 'claude-3.5') {
    // Initialize AI service - NO MOCK ALLOWED
    const aiConfig: AIConfig = {
      provider: (process.env.AI_PROVIDER as any) || 'claude',
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL || aiModel,
      baseUrl: process.env.AI_BASE_URL,
    };

    if (!aiConfig.apiKey) {
      throw new Error('AI_API_KEY is required. No simulated data allowed.');
    }

    this.aiService = new AIService(aiConfig);
  }

  /**
   * Generate brand kit with initial "modern" tone
   */
  async generateBrandKit(input: BrandKitInput): Promise<BrandKit> {
    // Extract brand name (strip TLD)
    const brandName = this.extractBrandName(input.idea, input.domain);

    // Step 1: Analyze brand meaning (cached)
    const analysis = await this.analyzeBrandMeaning(brandName, input.idea);

    // Step 2: Generate "modern" tone creative (initial load)
    const modernCreative = await this.generateToneCreative(
      brandName,
      analysis,
      'modern',
      input.audience
    );

    return {
      brandName,
      tones: {
        modern: modernCreative,
        playful: null,  // Lazy loaded
        formal: null    // Lazy loaded
      }
    };
  }

  /**
   * Generate creative content for a specific tone
   * Used for lazy loading and "Generate Again"
   */
  async generateToneCreative(
    brandName: string,
    analysis: BrandAnalysis,
    tone: BrandTone,
    audience?: string,
    regenerate: boolean = false
  ): Promise<ToneCreative> {
    const toneDescriptions = {
      modern: {
        aesthetic: 'innovative, cutting-edge, tech-forward, sleek, minimalist, contemporary',
        colorPalette: 'Modern gradient blues, electric cyan, clean whites, deep navy',
        typography: 'Sans-serif, geometric, clean (e.g., Poppins, Inter, Montserrat)',
      },
      playful: {
        aesthetic: 'fun, energetic, vibrant, creative, friendly, approachable, youthful',
        colorPalette: 'Bright oranges, lime greens, sunny yellows, warm pinks',
        typography: 'Rounded, friendly, bouncy (e.g., Fredoka, Nunito, Quicksand)',
      },
      formal: {
        aesthetic: 'professional, trustworthy, established, premium, authoritative, sophisticated',
        colorPalette: 'Deep charcoal, metallic gold, rich burgundy, classic navy',
        typography: 'Serif, elegant, timeless (e.g., Playfair Display, Merriweather, Lora)',
      }
    };

    const toneInfo = toneDescriptions[tone];
    const variationHint = regenerate
      ? '\n\nIMPORTANT: Generate a DIFFERENT creative direction from previous attempts. Explore alternative metaphors, angles, and visual concepts. Be novel and creative.'
      : '';

    const prompt = {
      system: `You are an expert brand strategist and creative director with deep understanding of visual design, typography, and brand storytelling. You create coherent brand narratives where taglines and logos tell the same story.`,
      user: `Brand Analysis:
- Brand Name: "${brandName}"
- Core Meaning: ${analysis.meaning}
- Industry: ${analysis.industry}
- Emotional Associations: ${analysis.emotions.join(', ')}
- Visual Metaphors Available: ${analysis.visualMetaphors.join(', ')}
- Target Audience: ${audience || 'general audience'}
- Tone: ${tone} (${toneInfo.aesthetic})${variationHint}

Generate ONE unique, cohesive brand identity that tells a complete story:

1. TAGLINE (10-15 words max):
   - Must reference the brand's core meaning ("${analysis.meaning}")
   - Must match ${tone} tone perfectly
   - Professional, memorable, and emotionally resonant
   - Should align with the logo concept below

2. LOGO CONCEPT (detailed 2-3 sentence description):
   - Specific visual concept that reflects "${analysis.meaning}"
   - Use ONE visual metaphor from: ${analysis.visualMetaphors.join(', ')}
   - Include typography style for ${tone} aesthetic (${toneInfo.typography})
   - Include complete color palette with 2-3 specific HEX codes (${toneInfo.colorPalette})
   - Describe overall mood, style, and design elements
   - The logo should visually express what the tagline promises

The tagline and logo must form a coherent brand narrative - they should reference each other and tell the same brand story.

Return ONLY valid JSON in this exact structure:
{
  "tagline": "Your tagline here",
  "logoPrompt": "Detailed logo description including specific colors (#HEXCODE format), typography, visual metaphors, and mood",
  "colors": {
    "primary": "#HEXCODE",
    "secondary": "#HEXCODE",
    "accent": "#HEXCODE"
  },
  "typography": {
    "heading": "Font Name",
    "body": "Font Name"
  }
}`,
      maxTokens: 1000,
      temperature: regenerate ? 0.9 : 0.8  // Higher temp for regeneration
    };

    const response = await this.aiService.generateContent(prompt);
    return this.parseToneCreative(response);
  }

  /**
   * Generate creative content for a specific section only
   * Used for individual section regeneration
   */
  async generateSectionCreative(
    brandName: string,
    analysis: BrandAnalysis,
    tone: BrandTone,
    audience?: string,
    section?: 'tagline' | 'logoPrompt' | 'colors' | 'typography'
  ): Promise<any> {
    const toneDescriptions = {
      modern: {
        aesthetic: 'innovative, cutting-edge, tech-forward, sleek, minimalist, contemporary',
        colorPalette: 'Modern gradient blues, electric cyan, clean whites, deep navy',
        typography: 'Sans-serif, geometric, clean (e.g., Poppins, Inter, Montserrat)',
      },
      playful: {
        aesthetic: 'fun, energetic, vibrant, creative, friendly, approachable, youthful',
        colorPalette: 'Bright oranges, lime greens, sunny yellows, warm pinks',
        typography: 'Rounded, friendly, bouncy (e.g., Fredoka, Nunito, Quicksand)',
      },
      formal: {
        aesthetic: 'professional, trustworthy, established, premium, authoritative, sophisticated',
        colorPalette: 'Deep charcoal, metallic gold, rich burgundy, classic navy',
        typography: 'Serif, elegant, timeless (e.g., Playfair Display, Merriweather, Lora)',
      }
    };

    const toneInfo = toneDescriptions[tone];

    let prompt: any;

    switch (section) {
      case 'tagline':
        prompt = {
          system: `You are an expert brand strategist specializing in memorable taglines.`,
          user: `Brand: "${brandName}"
Core Meaning: ${analysis.meaning}
Industry: ${analysis.industry}
Emotional Associations: ${analysis.emotions.join(', ')}
Target Audience: ${audience || 'general audience'}
Tone: ${tone} (${toneInfo.aesthetic})

Generate ONE unique tagline (10-15 words max) that:
- References the brand's core meaning ("${analysis.meaning}")
- Matches ${tone} tone perfectly
- Is professional, memorable, and emotionally resonant

Return ONLY valid JSON: {"tagline": "Your tagline here"}`,
          maxTokens: 200,
          temperature: 0.9
        };
        break;

      case 'logoPrompt':
        prompt = {
          system: `You are an expert logo designer with deep understanding of visual design principles.`,
          user: `Brand: "${brandName}"
Core Meaning: ${analysis.meaning}
Visual Metaphors: ${analysis.visualMetaphors.join(', ')}
Tone: ${tone} (${toneInfo.aesthetic})

Generate ONE detailed logo concept (2-3 sentences) that:
- Uses ONE visual metaphor from: ${analysis.visualMetaphors.join(', ')}
- Includes typography style for ${tone} aesthetic (${toneInfo.typography})
- Includes complete color palette with 2-3 specific HEX codes (${toneInfo.colorPalette})
- Describes overall mood, style, and design elements

Return ONLY valid JSON: {"logoPrompt": "Detailed description here"}`,
          maxTokens: 300,
          temperature: 0.9
        };
        break;

      case 'colors':
        prompt = {
          system: `You are an expert color theory specialist creating cohesive brand color palettes.`,
          user: `Brand: "${brandName}"
Core Meaning: ${analysis.meaning}
Emotions: ${analysis.emotions.join(', ')}
Tone: ${tone} (${toneInfo.aesthetic})
Suggested Palette: ${toneInfo.colorPalette}

Generate a cohesive 3-color palette with specific HEX codes that:
- Reflects ${tone} aesthetic
- Evokes: ${analysis.emotions.join(', ')}
- Works well together visually

Return ONLY valid JSON:
{
  "colors": {
    "primary": "#HEXCODE",
    "secondary": "#HEXCODE",
    "accent": "#HEXCODE"
  }
}`,
          maxTokens: 200,
          temperature: 0.9
        };
        break;

      case 'typography':
        prompt = {
          system: `You are an expert typographer selecting fonts that match brand aesthetics.`,
          user: `Brand: "${brandName}"
Tone: ${tone} (${toneInfo.aesthetic})
Typography Style: ${toneInfo.typography}

Select 2 complementary fonts (heading and body) that:
- Match ${tone} aesthetic perfectly
- Work well together
- Are professional and web-safe

Return ONLY valid JSON:
{
  "typography": {
    "heading": "Font Name",
    "body": "Font Name"
  }
}`,
          maxTokens: 150,
          temperature: 0.8
        };
        break;
    }

    const response = await this.aiService.generateContent(prompt);

    // Parse the JSON response
    try {
      const cleaned = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);

        // Return just the section data
        if (section === 'tagline') return parsed.tagline;
        if (section === 'logoPrompt') return parsed.logoPrompt;
        if (section === 'colors') return parsed.colors;
        if (section === 'typography') return parsed.typography;
      }
    } catch (error) {
      console.error(`Failed to parse ${section} response:`, error);
    }

    // Fallback values
    const fallbacks = {
      tagline: 'Innovation meets excellence',
      logoPrompt: 'Modern minimalist logo with clean typography and bold colors',
      colors: {
        primary: '#1E40AF',
        secondary: '#3B82F6',
        accent: '#60A5FA'
      },
      typography: {
        heading: 'Inter',
        body: 'Inter'
      }
    };

    return section ? fallbacks[section] : fallbacks.tagline;
  }

  /**
   * Analyze brand meaning (Step 1 - cached per brand name)
   */
  private async analyzeBrandMeaning(brandName: string, idea: string): Promise<BrandAnalysis> {
    // Check cache first
    const cacheKey = brandName.toLowerCase();
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const prompt = {
      system: `You are a brand analyst expert. Analyze brand names to extract deep semantic meaning, industry implications, emotional associations, and visual metaphors.`,
      user: `Analyze this brand name: "${brandName}"
Context: ${idea}

Provide a comprehensive brand analysis:

1. Core Meaning: What does this name represent? What is its deeper significance?
2. Industry: What industry or category does this suggest?
3. Emotional Associations: What emotions or feelings does this evoke? (list 3-5)
4. Visual Metaphors: What visual symbols, shapes, or imagery could represent this brand? (list 4-6 specific, concrete visual concepts)

Return ONLY valid JSON:
{
  "meaning": "One clear sentence describing the core meaning",
  "industry": "Industry category",
  "emotions": ["emotion1", "emotion2", "emotion3"],
  "visualMetaphors": ["metaphor1", "metaphor2", "metaphor3", "metaphor4"]
}`,
      maxTokens: 500,
      temperature: 0.7
    };

    const response = await this.aiService.generateContent(prompt);
    const analysis = this.parseBrandAnalysis(response);

    // Cache the analysis
    this.analysisCache.set(cacheKey, analysis);

    return analysis;
  }

  /**
   * Extract brand name from search query (strip TLD)
   */
  private extractBrandName(idea: string, domain?: string): string {
    // If domain is provided, use its root
    if (domain) {
      return domain.replace(/\.(com|net|org|io|co|ai|app|dev|tech|biz|info|me|us|uk|ca)$/i, '');
    }

    // Clean up the idea string
    let brandName = idea
      .toLowerCase()
      .replace(/^brand for /i, '')  // Remove "Brand for" prefix
      .replace(/\.(com|net|org|io|co|ai|app|dev|tech|biz|info|me|us|uk|ca)$/i, '')  // Remove TLDs
      .replace(/[^a-z0-9\s-]/g, '')  // Keep only alphanumeric, spaces, hyphens
      .trim();

    // If multiple words, take the first meaningful word or combine
    const words = brandName.split(/\s+/);
    if (words.length === 1) {
      return brandName;
    }

    // Remove filler words
    const fillerWords = ['the', 'a', 'an', 'for', 'and', 'or', 'of', 'in', 'on', 'to'];
    const meaningful = words.filter(w => !fillerWords.includes(w) && w.length > 2);

    if (meaningful.length === 1) {
      return meaningful[0];
    }

    // Combine first two meaningful words (no space)
    return meaningful.slice(0, 2).join('');
  }

  /**
   * Parse brand analysis JSON response
   */
  private parseBrandAnalysis(response: string): BrandAnalysis {
    try {
      const cleaned = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);

        return {
          meaning: parsed.meaning || 'A unique brand concept',
          industry: parsed.industry || 'general',
          emotions: Array.isArray(parsed.emotions) ? parsed.emotions : ['innovative', 'trustworthy', 'professional'],
          visualMetaphors: Array.isArray(parsed.visualMetaphors) ? parsed.visualMetaphors : ['abstract shapes', 'modern icon', 'lettermark', 'geometric pattern']
        };
      }
    } catch (error) {
      console.error('Failed to parse brand analysis:', error);
    }

    // Fallback analysis
    return {
      meaning: 'A modern brand concept',
      industry: 'technology',
      emotions: ['innovative', 'reliable', 'professional'],
      visualMetaphors: ['abstract icon', 'lettermark', 'geometric shapes', 'modern symbol']
    };
  }

  /**
   * Parse tone creative JSON response
   */
  private parseToneCreative(response: string): ToneCreative {
    try {
      const cleaned = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(jsonStr);

        // Validate and clean
        return {
          tagline: (parsed.tagline || 'Innovation meets excellence').trim(),
          logoPrompt: (parsed.logoPrompt || 'Modern minimalist logo design').trim(),
          colors: {
            primary: this.validateHexColor(parsed.colors?.primary) || '#1E40AF',
            secondary: this.validateHexColor(parsed.colors?.secondary) || '#3B82F6',
            accent: parsed.colors?.accent ? this.validateHexColor(parsed.colors.accent) : '#60A5FA'
          },
          typography: {
            heading: parsed.typography?.heading || 'Inter',
            body: parsed.typography?.body || 'Inter'
          }
        };
      }
    } catch (error) {
      console.error('Failed to parse tone creative:', error);
    }

    // Fallback creative
    return {
      tagline: 'Innovation meets excellence',
      logoPrompt: 'Modern minimalist logo with clean typography and bold colors',
      colors: {
        primary: '#1E40AF',
        secondary: '#3B82F6',
        accent: '#60A5FA'
      },
      typography: {
        heading: 'Inter',
        body: 'Inter'
      }
    };
  }

  /**
   * Validate hex color code
   */
  private validateHexColor(color: string | undefined): string | undefined {
    if (!color) return undefined;

    // Ensure it starts with #
    const hex = color.startsWith('#') ? color : `#${color}`;

    // Validate hex format (#RGB or #RRGGBB)
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
      return hex.toUpperCase();
    }

    return undefined;
  }
}
