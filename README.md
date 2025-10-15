# Brand Validator

A comprehensive tool for validating domains, generating brand kits, and providing IP guidance for business ideas.

## Features

### Domain Verify
- Check domain availability across multiple registrars (Porkbun, Namecheap, GoDaddy)
- Generate alternative domain suggestions
- Show pricing and promotional offers
- Direct affiliate links to purchase domains

### Brand Kit Generator
- AI-powered brand name generation with multiple variants
- Tagline suggestions
- Color palette generation with hex codes
- Typography recommendations
- Logo generation prompts for AI tools
- Starter copy for websites and marketing

### Trust & IP Guidance
- Trademark risk assessment
- Nice classification suggestions
- Official search links (USPTO, EUIPO, UKIPO, WIPO)
- Copyright guidance
- Legal disclaimer and next steps checklist

### Social Handle Checks
- Check availability across Instagram, TikTok, Twitter, YouTube, LinkedIn
- Overall availability score
- Direct links to claim available handles

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Services**: Domain registrar APIs, AI integration, Social platform checks
- **Affiliate**: Integrated affiliate tracking and redirects

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.example .env.local
   ```
   Fill in your API keys and affiliate IDs.

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Required
- `REGISTRAR_API_KEY` - Porkbun API key
- `REGISTRAR_API_SECRET` - Porkbun secret key
- `AFF_PORKBUN_ID` - Porkbun affiliate ID

### Optional
- `NAMECHEAP_API_USER` - Namecheap API user
- `NAMECHEAP_API_KEY` - Namecheap API key
- `NAMECHEAP_USERNAME` - Namecheap username
- `AFF_NAMECHEAP_ID` - Namecheap affiliate ID
- `AFF_GODADDY_ID` - GoDaddy affiliate ID
- `AFF_LOGOAI_ID` - LogoAI affiliate ID
- `AFF_ZOVIZ_ID` - Zoviz affiliate ID
- `AFF_LOGOME_ID` - LogoMe affiliate ID
- `AI_MODEL` - AI model to use (default: claude-3.5)

## API Endpoints

### POST /api/domain-check
Check domain availability and pricing.

**Input**: `{ domain: "example.com" }`
**Output**: `DomainResult`

### POST /api/social-check
Check social handle availability.

**Input**: `{ handleBase: "example" }`
**Output**: `SocialCheckResult`

### POST /api/brand-kit
Generate brand kit from idea.

**Input**: `{ idea: "AI writing tool", tone: "modern", audience: "writers" }`
**Output**: `BrandKit`

### POST /api/ip-guidance
Generate IP guidance for brand name.

**Input**: `{ brandName: "Example", categories: ["technology"] }`
**Output**: `IPGuidance`

### POST /api/affiliate/click
Track affiliate clicks and redirect.

**Input**: `{ partner: "porkbun", offer: "domain", url: "example.com" }`
**Output**: 302 redirect to affiliate URL

## Usage

1. **Domain Search**: Enter a domain (e.g., "promptguy.ai") to check availability and get brand suggestions
2. **Idea Search**: Enter a business idea (e.g., "AI writing tool") to generate a complete brand kit
3. **Review Results**: Check domain availability, brand suggestions, and IP guidance
4. **Take Action**: Use affiliate links to purchase domains or generate logos

## MVP Features

✅ Domain availability checking with 1 registrar
✅ Brand kit generation with AI prompts
✅ IP guidance with official search links
✅ Single-page UI with three rails
✅ Affiliate button integration

## Future Enhancements

- Social handle checks
- Additional registrars and brand kit partners
- Persistent project save/export
- Database integration for tracking
- Advanced AI model integration

## Legal Disclaimer

This tool provides general information on trademarks and copyrights and does not constitute legal advice. For clearance, consult a qualified attorney.