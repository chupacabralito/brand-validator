export type DomainResult = {
  query: string;
  root: string;              // "promptguy"
  tld: string;               // ".ai"
  available: boolean;
  registrarPrices?: {        // optional if API supports it
    registrar: "porkbun" | "namecheap" | "godaddy";
    priceUsd: number;
    promo?: string;
  }[];
  alternates: { domain: string; available?: boolean; score: number }[];
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
