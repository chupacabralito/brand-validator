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
  platform: "instagram" | "tiktok" | "twitter" | "youtube" | "linkedin" | "facebook" | "snapchat" | "pinterest" | "discord" | "threads" | "reddit" | "twitch" | "medium" | "github";
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

export type BrandTone = "modern" | "playful" | "formal";

export type ToneCreative = {
  tagline: string;                // Single tagline for this tone
  logoPrompt: string;             // Detailed logo concept with colors/typography
  colors: {
    primary: string;              // Hex code
    secondary: string;            // Hex code
    accent?: string;              // Hex code (optional)
  };
  typography: {
    heading: string;              // Font name
    body: string;                 // Font name
  };
};

export type BrandKit = {
  brandName: string;              // Search query stripped of TLD (e.g., "sportspace")
  tones: {
    modern: ToneCreative | null;  // Generated initially
    playful: ToneCreative | null; // Lazy loaded
    formal: ToneCreative | null;  // Lazy loaded
  };
  // Legacy fields for backward compatibility (optional)
  rationale?: string;
  voice?: { adjectives: string[]; sampleOneLiner: string };
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
