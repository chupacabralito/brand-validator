# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Brand Validator is a Next.js 14 application that provides comprehensive brand validation services including domain availability checking, AI-powered brand kit generation, trademark searching, social handle validation, and IP guidance. The app uses a three-rail layout to present domain, brand, and IP information simultaneously.

## Deployment

**Production URL**: https://www.domainhunk.com (HTTP automatically redirects to HTTPS with www)

The application is deployed to Vercel and served via the custom domain domainhunk.com. When testing production APIs or deployment, always use this URL with HTTPS and www subdomain.

- **GitHub Repository**: https://github.com/chupacabralito/brand-validator
- **Deployment Method**: Automatic deployment via Vercel on push to `main` branch (PRIMARY METHOD)
- **Environment Variables**: Configured in Vercel dashboard under project settings

### Deploying Changes to Production

**ALWAYS use git push for deployment** - this is the automatic and recommended method:

```bash
# 1. Build and test locally
npm run build

# 2. Stage your changes
git add <files>

# 3. Commit with descriptive message
git commit -m "Your commit message"

# 4. Push to GitHub (triggers automatic Vercel deployment)
git push origin main
```

Vercel will automatically:
- Detect the push to `main` branch
- Build the application
- Run any configured build checks
- Deploy to production at https://www.domainhunk.com
- Update environment variables from Vercel dashboard

**Do NOT use** `vercel deploy` or `npx vercel --prod` directly unless Vercel CLI is properly authenticated. Git push is the preferred and automatic deployment method.

## Development Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production
npm run build           # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
```

## Database Commands

```bash
# Prisma commands
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run migrations in development
npx prisma studio       # Open Prisma Studio GUI
npx prisma db push      # Push schema changes without migrations
```

## Architecture

### Service Layer (`src/lib/services/`)

All business logic lives in service classes that are instantiated in API routes:

- **aiService.ts**: AI provider abstraction (OpenAI, Claude/Anthropic). **Note**: Mock AI is intentionally disabled - real API keys are required.
- **brandKit.ts**: Brand kit generation with name variants, taglines, color palettes, typography, logo prompts. Uses AI service for creative content.
- **domainService.ts**: Domain availability checking via WHOIS API and Namecheap. **Note**: DNS-only checks are unreliable - uses real APIs only.
- **registrar.ts**: Domain registrar integrations and pricing data
- **social.ts**: Social media handle availability checking (Instagram, TikTok, Twitter, YouTube, LinkedIn)
- **trademarkSearch.ts**: Trademark search using Marker API (primary) or USPTO API (fallback). Searches USPTO trademark database with comprehensive matching and risk assessment
- **compositeScore.ts**: Weighted scoring algorithm combining domain, social, trademark, and brand data
- **affiliates.ts**: Affiliate link generation and click tracking
- **analytics.ts**: Event tracking and session management

### API Routes (`src/app/api/`)

Next.js 14 App Router API routes in `route.ts` files:

- **domain-check/route.ts**: POST endpoint accepting `{ domain: string }`
- **brand-kit/route.ts**: POST endpoint accepting `{ idea, tone, audience, domain?, constraints?, mustContain?, avoid? }`
- **social-check/route.ts**: POST endpoint accepting `{ handleBase: string }`
- **trademark-search/route.ts**: POST endpoint accepting `{ brandName, classes?, includeInternational? }`
- **ip-guidance/route.ts**: POST endpoint for trademark/copyright guidance
- **composite-score/route.ts**: POST endpoint combining all validation results
- **affiliate/click/route.ts**: POST endpoint for affiliate tracking
- **analytics/route.ts**: POST endpoint for analytics events

### Frontend Components (`src/app/components/`)

React Server Components (RSC) and Client Components:

- **SearchBox.tsx**: Main search input with domain/idea detection
- **DomainRail.tsx**: Domain availability results with registrar links
- **BrandKitRail.tsx**: AI-generated brand suggestions
- **SocialHandlesRail.tsx**: Social media availability results
- **TrademarkSearchResults.tsx**: Trademark search results with filtering
- **CompositeScoreBar.tsx**: Overall brand score visualization
- **IPGuidanceRail.tsx**: IP guidance and trademark recommendations

### Data Flow

1. User enters domain or idea in SearchBox
2. `page.tsx` detects query type (domain regex vs idea)
3. Parallel API calls to relevant endpoints
4. Individual results update state independently
5. `useEffect` triggers composite score calculation when all results available
6. Rails render results with loading states

### Database Schema (Prisma)

SQLite database with the following models:

- **Session**: User session tracking with search history
- **AffiliateClick**: Affiliate link tracking with conversion data
- **SearchLog**: Search query logging with results and performance
- **ExperimentLog**: A/B testing and feature experiments
- **DomainCache**: Cached WHOIS/DNS data with expiration
- **BrandKitCache**: Cached AI-generated brand kits
- **AnalyticsEvent**: General analytics event tracking

Access via `src/lib/db.ts` which exports Prisma client instance.

## Environment Configuration

**Critical**: AI and domain checking require real API keys. No mock/fallback data is allowed.

### Required Variables
```bash
# AI Configuration (REQUIRED - no mock allowed)
AI_PROVIDER=claude          # 'openai' | 'claude' | 'anthropic'
AI_API_KEY=sk-...          # Real API key required
AI_MODEL=claude-3-haiku-20240307  # or gpt-3.5-turbo

# Domain Checking (at least one required)
WHOIS_API_KEY=...          # WhoisXMLAPI key (preferred)
NAMECHEAP_API_KEY=...      # Namecheap API key (fallback)
NAMECHEAP_API_USER=...
NAMECHEAP_USERNAME=...
NAMECHEAP_CLIENT_IP=...

# Trademark Search (uses Zyla API - same key as social media)
ZYLA_API_KEY=...           # Zyla API key (https://zylalabs.com) - PRIMARY
MARKER_API_USERNAME=...    # Marker API username (fallback - currently unreliable)
MARKER_API_PASSWORD=...    # Marker API password (fallback)
USPTO_API_KEY=...          # USPTO API key (secondary fallback)

# Social Handle Verification (recommended - $24.99/month for 2,000 requests)
ZYLA_API_KEY=...           # Zyla API key (https://zylalabs.com)

# Database
DATABASE_URL=file:./brand-validator.db
```

### Optional Variables
```bash
# Affiliate IDs
AFF_PORKBUN_ID=...
AFF_NAMECHEAP_ID=...
AFF_GODADDY_ID=...
AFF_LOGOAI_ID=...
AFF_ZOVIZ_ID=...
AFF_LOGOME_ID=...
AFF_TRADEMARKFACTORY_ID=...
AFF_TRADEMARKCENTER_ID=...
AFF_TRADEMARKPLUS_ID=...
```

## Key Implementation Details

### AI Service Pattern

The AI service is provider-agnostic but **requires real API keys**:

```typescript
const aiService = new AIService({
  provider: process.env.AI_PROVIDER as 'openai' | 'claude',
  apiKey: process.env.AI_API_KEY, // Required
  model: process.env.AI_MODEL
});

const result = await aiService.generateContent({
  system: "You are a brand strategist...",
  user: "Generate brand names for...",
  maxTokens: 500,
  temperature: 0.7
});
```

### Domain Checking Strategy

Domain availability uses a tiered approach:
1. WHOIS API (primary - most accurate)
2. Namecheap API (fallback - requires API access)
3. **No DNS/HTTP fallback** - these methods are unreliable

The service throws errors if no valid API is configured rather than returning simulated data.

### Brand Kit Generation

Brand kits are generated with template-based fallbacks for structural elements (name variants, color palettes) but **require real AI** for creative content (taglines, copy):

- Name variants: Template-based using search term analysis
- Taglines: **AI-required** (no templates allowed)
- Colors/Typography: Template-based with industry detection
- Logo prompts: Template-based with term interpolation

### Trademark Search Strategy

Trademark searches use a tiered approach with Zyla API as primary source:

1. **Zyla Trademark Search API** (primary - RECOMMENDED): Professional, reliable trademark search
   - Part of Zyla API Hub (same key as social media verification)
   - Official USPTO database source
   - REST API with Bearer token authentication
   - 3 specialized endpoints: Search, Availability Check, Comprehensive Search
   - Returns trademark name, owner, status, classes, goods/services, registration details
   - Automatic similarity scoring and risk assessment
   - Pricing: $24.99/mo (500 requests), $49.99/mo (5,000 requests), $99.99/mo (50,000 requests)
   - 7-day free trial (50 API calls)
   - Rate limits: 60-120 requests/minute
   - URL: `https://zylalabs.com/api/1495/trademark+search+api/1238/trademark+search`
   - Method: POST with JSON body `{ keyword: "brandname" }`

2. **Marker API** (secondary fallback - currently unreliable):
   - Free tier but experiencing 302 redirect issues
   - May be deprecated or migrating services
   - Only used if Zyla API fails

3. **USPTO API** (tertiary fallback): Official USPTO TSDR API
   - Free but may have reliability issues
   - Requires USPTO_API_KEY

4. **Rule-based assessment** (last resort): Identifies known high-risk brands
   - Only used if all APIs fail
   - Checks against database of major tech brands and common trademark terms
   - Returns low risk for unique names, high risk for known brands

The service automatically calculates:
- Similarity scores using Levenshtein distance
- Risk levels (high/medium/low) based on similarity and trademark status
- Trademark class overlaps
- Brand name variations and phonetic matches

### Social Handle Checking Strategy

Social media handle availability uses a hybrid approach combining Zyla API verification with heuristics-based estimation:

1. **Zyla API** (primary - recommended): Real-time verification for priority platforms
   - Platforms: Instagram, TikTok, Facebook
   - REST API with Bearer token authentication
   - Returns: `{is_available: boolean, url: string}`
   - Confidence: 95% (verified by API)
   - API: Social Media Handle Insight API (ID: 7506)
   - URL format: `https://zylalabs.com/api/7506/social+media+handle+insight+api/{endpoint_id}/{platform}+username+validator?handle={handle}`
   - Endpoint IDs: Instagram (12091), TikTok (12079), Facebook (12086)
   - Pricing: $24.99/month (2,000 requests) to $199.99/month (50,000 requests)

2. **Heuristics-based estimation** (secondary): For platforms not covered by Zyla API
   - Platforms: Twitter, YouTube, LinkedIn, Snapchat, Pinterest, Discord
   - 15+ rule system analyzing handle characteristics:
     - Length analysis (30% weight)
     - Dictionary words (20%)
     - Name patterns (15%)
     - Brand names (15%)
     - Reserved words (10%)
     - Sequential patterns, entropy, pronounceability, platform competitiveness
   - Confidence: Variable (typically 60-85%)
   - Implemented in `socialHeuristics.ts`

3. **Fallback behavior**: If Zyla API fails for any reason
   - Automatically falls back to heuristics for affected platforms
   - Logs error for debugging
   - Maintains service availability even if API is down

The service provides:
- Parallel API calls to minimize latency
- Proper handle formatting per platform (@username for Instagram/TikTok/Twitter)
- Platform URLs for manual verification
- Clear distinction between verified (95% confidence) and estimated results

### Composite Scoring Algorithm

The composite score (`src/lib/services/compositeScore.ts`) uses weighted factors:
- Domain availability: 30%
- Social handles: 20%
- Trademark conflicts: 30%
- Brand quality: 20%

Recalculated automatically when trademark category filter changes.

## Important Constraints

1. **No Mock Data**: The codebase explicitly disallows simulated/mock data for AI and domain checking. Real API keys must be configured.

2. **DNS Checks Are Unreliable**: Domain availability cannot be accurately determined via DNS alone. Registered domains may have no DNS records. Always use WHOIS or registrar APIs.

3. **Path Aliases**: Use `@/*` import alias for `src/*` (configured in `tsconfig.json`)

4. **Client vs Server Components**: Most components are client components (`'use client'`) due to state management. API routes are server-side only.

5. **Error Handling**: Services throw errors rather than returning fallback data. API routes should catch and return appropriate HTTP status codes.

## Testing During Development

Since real APIs are required:
1. Set up `.env.local` with real API keys (copy from `env.example`)
2. Use small/cheap AI models (Claude Haiku, GPT-3.5) to minimize costs
3. Test with actual domain queries to verify WHOIS/registrar integration
4. Monitor API usage in provider dashboards

## Common Development Workflows

### Adding a New Service

1. Create service class in `src/lib/services/`
2. Add corresponding API route in `src/app/api/[service-name]/route.ts`
3. Import and use in `page.tsx` with state management
4. Create UI component in `src/app/components/`
5. Update composite score algorithm if needed

### Modifying AI Prompts

AI prompts are defined inline in service methods (e.g., `brandKit.ts:buildPrompt()`). Changes to prompts require:
1. Update prompt string in service
2. Test with real AI provider
3. Validate response parsing logic handles new format

### Adding Database Models

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev` or `npx prisma db push`
3. Run `npx prisma generate` to update client
4. Import updated client from `src/lib/db.ts`
