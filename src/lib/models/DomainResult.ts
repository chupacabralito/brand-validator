export type DomainStatus = "available" | "taken";

export type DomainResult = {
  query: string;
  root: string;              // "promptguy"
  tld: string;               // ".ai"
  available: boolean;        // Deprecated: use status instead (kept for backward compatibility)
  status: DomainStatus;      // "available" or "taken"

  // Pricing info (for available domains)
  pricing?: {
    registration: number;
    renewal: number;
    currency: string;
    registrar: string;       // Always "Namecheap" for us
  };

  // WHOIS info (for taken domains)
  registrar?: string;
  registrationDate?: string;
  expirationDate?: string;

  alternates: {
    domain: string;
    available?: boolean;     // Deprecated: use status instead
    status?: DomainStatus;   // "available" or "taken"
    score: number;
    pricing?: {
      registration: number;
      renewal: number;
      currency: string;
      registrar: string;
    };
  }[];

  dnsHistoryFlag?: "clean" | "unknown" | "risky";
  lastChecked?: string;      // ISO timestamp of when checked
  cacheExpiry?: string;      // ISO timestamp of when cache expires
  fromCache?: boolean;       // Whether result came from cache
}

export type SocialHandleResult = {
  platform: "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "facebook" | "snapchat" | "pinterest" | "discord";
  handle: string;
  available: boolean;
  url: string;
  followerCount?: number;
  verified?: boolean;
  confidence?: number; // 0-100, how confident the heuristic is
  factors?: string[]; // reasons for the availability assessment
}

export type SocialCheckResult = {
  baseHandle: string;
  platforms: SocialHandleResult[];
  overallScore: number; // 0-100 based on availability across platforms
}

export type BrandKit = {
  rationale: string;               // 2–3 sentences: "why these directions"
  nameVariants: { value: string; tone: "modern"|"playful"|"serious"; score: number }[];
  taglines: string[];
  voice: { adjectives: string[]; sampleOneLiner: string };
  logoPrompts: string[];           // prompts for logo gen tools (SVG-first bias)
  socialHandleIdeas: string[];     // adjusted for availability
  starterCopy: {
    heroH1: string;
    subhead: string;
    valueProps: string[];
    boilerplate: string;
  };
}

export type IPGuidance = {
  tmRiskNotes: string[];      // generic risks, similarity warnings, category overlap
  classesGuess: number[];     // Nice classes guess e.g., [35, 42]
  officialSearchLinks: {      // deep links for manual review
    usptoTESS: string;
    euipoEsearch: string;
    ukipoSearch: string;
    wipoGlobal: string;
  };
  copyrightNotes: string[];   // what copyright covers/doesn't in branding
  nextStepsChecklist: string[]; // "run official search", "consult counsel", etc.
  disclaimer: string;         // plain legal disclaimer
}

export type AffiliateClick = {
  partner: string;
  offer: string;
  url: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  timestamp: Date;
  sessionId: string;
}
