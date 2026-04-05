import { NextRequest, NextResponse } from 'next/server';
import { BrandKit, BrandTone, ToneCreative } from '@/lib/models/DomainResult';
import { BrandKitInput } from '@/lib/services/brandKit';
import { CompositeScoreInput } from '@/lib/services/compositeScore';
import { TrademarkMatch } from '@/lib/services/trademarkSearch';

type JsonObject = Record<string, unknown>;

type ValidationSuccess<T> = {
  success: true;
  data: T;
};

type ValidationFailure = {
  success: false;
  error: string;
  status: number;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

type BrandKitSection = 'tagline' | 'logoPrompt' | 'colors' | 'typography';

type BrandKitVoiceActualValues = {
  tagline?: string;
  colors?: ToneCreative['colors'];
  typography?: ToneCreative['typography'];
};

type BrandKitVoiceRequest = {
  actualValues?: BrandKitVoiceActualValues;
  audience?: string;
  brandName: string;
  regenerate: boolean;
  regenerateOnly?: BrandKitSection;
  searchTerm: string;
  tone: BrandTone;
};

const BRAND_TONES: readonly BrandTone[] = ['modern', 'playful', 'formal'];
const BRAND_KIT_SECTIONS: readonly BrandKitSection[] = ['tagline', 'logoPrompt', 'colors', 'typography'];
const COMPLETE_DOMAIN_REGEX = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]?\.([a-z]{2,}|[a-z]{2,}\.[a-z]{2,})$/i;
const NAME_ONLY_REGEX = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]?$/i;
const SOCIAL_HANDLE_REGEX = /^[a-z0-9_]{1,30}$/i;
const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i;

function invalid(error: string, status: number = 400): ValidationFailure {
  return {
    success: false,
    error,
    status
  };
}

function success<T>(data: T): ValidationSuccess<T> {
  return {
    success: true,
    data
  };
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeString(
  value: unknown,
  fieldName: string,
  options: {
    allowEmpty?: boolean;
    maxLength?: number;
    minLength?: number;
    lowercase?: boolean;
  } = {}
): ValidationResult<string> {
  if (typeof value !== 'string') {
    return invalid(`${fieldName} must be a string`);
  }

  const normalized = options.lowercase ? value.trim().toLowerCase() : value.trim();

  if (!options.allowEmpty && normalized.length === 0) {
    return invalid(`${fieldName} is required`);
  }

  if (options.minLength && normalized.length < options.minLength) {
    return invalid(`${fieldName} must be at least ${options.minLength} characters`);
  }

  if (options.maxLength && normalized.length > options.maxLength) {
    return invalid(`${fieldName} must be at most ${options.maxLength} characters`);
  }

  return success(normalized);
}

function parseOptionalString(
  value: unknown,
  fieldName: string,
  options: {
    maxLength?: number;
    minLength?: number;
    lowercase?: boolean;
  } = {}
): ValidationResult<string | undefined> {
  if (value === undefined || value === null || value === '') {
    return success(undefined);
  }

  const parsed = normalizeString(value, fieldName, options);
  if (!parsed.success) {
    return parsed;
  }

  return success(parsed.data);
}

function parseBoolean(value: unknown, fieldName: string, fallback: boolean): ValidationResult<boolean> {
  if (value === undefined || value === null) {
    return success(fallback);
  }

  if (typeof value !== 'boolean') {
    return invalid(`${fieldName} must be a boolean`);
  }

  return success(value);
}

function parseStringArray(
  value: unknown,
  fieldName: string,
  options: {
    maxItems?: number;
    maxItemLength?: number;
  } = {}
): ValidationResult<string[]> {
  if (value === undefined || value === null) {
    return success([]);
  }

  if (!Array.isArray(value)) {
    return invalid(`${fieldName} must be an array of strings`);
  }

  const normalized: string[] = [];
  const maxItems = options.maxItems ?? 10;
  const maxItemLength = options.maxItemLength ?? 80;

  for (const item of value) {
    const parsed = normalizeString(item, fieldName, { maxLength: maxItemLength });
    if (!parsed.success) {
      return invalid(`${fieldName} must contain only non-empty strings`);
    }

    if (!normalized.includes(parsed.data)) {
      normalized.push(parsed.data);
    }
  }

  if (normalized.length > maxItems) {
    return invalid(`${fieldName} must contain at most ${maxItems} items`);
  }

  return success(normalized);
}

function parseClasses(value: unknown): ValidationResult<number[]> {
  if (value === undefined || value === null) {
    return success([]);
  }

  if (!Array.isArray(value)) {
    return invalid('Classes must be an array of integers');
  }

  const classes = new Set<number>();

  for (const item of value) {
    if (!Number.isInteger(item)) {
      return invalid('Classes must contain only integers');
    }

    const classNumber = Number(item);
    if (classNumber < 1 || classNumber > 45) {
      return invalid('Classes must be between 1 and 45');
    }

    classes.add(classNumber);
  }

  return success(Array.from(classes).sort((a, b) => a - b));
}

function parseTone(value: unknown, fieldName: string): ValidationResult<BrandTone> {
  const parsed = normalizeString(value, fieldName, { lowercase: true });
  if (!parsed.success) {
    return parsed;
  }

  if (!BRAND_TONES.includes(parsed.data as BrandTone)) {
    return invalid(`${fieldName} must be one of: modern, playful, formal`);
  }

  return success(parsed.data as BrandTone);
}

function parseOptionalTone(value: unknown, fieldName: string): ValidationResult<BrandTone | undefined> {
  if (value === undefined || value === null || value === '') {
    return success(undefined);
  }

  return parseTone(value, fieldName);
}

function parseOptionalSection(value: unknown): ValidationResult<BrandKitSection | undefined> {
  if (value === undefined || value === null || value === '') {
    return success(undefined);
  }

  const parsed = normalizeString(value, 'regenerateOnly');
  if (!parsed.success) {
    return parsed;
  }

  if (!BRAND_KIT_SECTIONS.includes(parsed.data as BrandKitSection)) {
    return invalid('regenerateOnly must be one of: tagline, logoPrompt, colors, typography');
  }

  return success(parsed.data as BrandKitSection);
}

function parseHexColor(value: unknown, fieldName: string): ValidationResult<string> {
  const parsed = normalizeString(value, fieldName);
  if (!parsed.success) {
    return parsed;
  }

  if (!HEX_COLOR_REGEX.test(parsed.data)) {
    return invalid(`${fieldName} must be a valid hex color`);
  }

  return success(parsed.data.toUpperCase());
}

function parseActualValues(value: unknown): ValidationResult<BrandKitVoiceActualValues | undefined> {
  if (value === undefined || value === null) {
    return success(undefined);
  }

  if (!isPlainObject(value)) {
    return invalid('actualValues must be an object');
  }

  const tagline = parseOptionalString(value.tagline, 'actualValues.tagline', { maxLength: 120 });
  if (!tagline.success) {
    return tagline;
  }

  let colors: ToneCreative['colors'] | undefined;
  if (value.colors !== undefined && value.colors !== null) {
    if (!isPlainObject(value.colors)) {
      return invalid('actualValues.colors must be an object');
    }

    const primary = parseHexColor(value.colors.primary, 'actualValues.colors.primary');
    if (!primary.success) {
      return primary;
    }

    const secondary = parseHexColor(value.colors.secondary, 'actualValues.colors.secondary');
    if (!secondary.success) {
      return secondary;
    }

    const accent = parseOptionalString(value.colors.accent, 'actualValues.colors.accent');
    if (!accent.success) {
      return accent;
    }

    if (accent.data && !HEX_COLOR_REGEX.test(accent.data)) {
      return invalid('actualValues.colors.accent must be a valid hex color');
    }

    colors = {
      primary: primary.data,
      secondary: secondary.data,
      accent: accent.data?.toUpperCase()
    };
  }

  let typography: ToneCreative['typography'] | undefined;
  if (value.typography !== undefined && value.typography !== null) {
    if (!isPlainObject(value.typography)) {
      return invalid('actualValues.typography must be an object');
    }

    const heading = normalizeString(value.typography.heading, 'actualValues.typography.heading', { maxLength: 80 });
    if (!heading.success) {
      return heading;
    }

    const body = normalizeString(value.typography.body, 'actualValues.typography.body', { maxLength: 80 });
    if (!body.success) {
      return body;
    }

    typography = {
      heading: heading.data,
      body: body.data
    };
  }

  return success({
    tagline: tagline.data,
    colors,
    typography
  });
}

function sanitizeTrademarkMatch(value: unknown): TrademarkMatch | null {
  if (!isPlainObject(value)) {
    return null;
  }

  if (typeof value.mark !== 'string' || typeof value.owner !== 'string' || typeof value.status !== 'string') {
    return null;
  }

  const goodsAndServices = Array.isArray(value.goodsAndServices)
    ? value.goodsAndServices.filter((item): item is string => typeof item === 'string')
    : [];
  const classes = Array.isArray(value.classes)
    ? value.classes.filter((item): item is number => Number.isInteger(item))
    : [];
  const riskLevel = value.riskLevel === 'low' || value.riskLevel === 'medium' || value.riskLevel === 'high'
    ? value.riskLevel
    : 'medium';

  return {
    mark: value.mark,
    owner: value.owner,
    status: value.status,
    registrationNumber: typeof value.registrationNumber === 'string' ? value.registrationNumber : undefined,
    filingDate: typeof value.filingDate === 'string' ? value.filingDate : undefined,
    goodsAndServices,
    classes,
    similarityScore: typeof value.similarityScore === 'number' && Number.isFinite(value.similarityScore)
      ? value.similarityScore
      : 0,
    riskLevel,
    notes: typeof value.notes === 'string' ? value.notes : ''
  };
}

function sanitizeToneCreative(value: unknown): ToneCreative | null {
  if (!isPlainObject(value) || !isPlainObject(value.colors) || !isPlainObject(value.typography)) {
    return null;
  }

  if (
    typeof value.tagline !== 'string' ||
    typeof value.logoPrompt !== 'string' ||
    typeof value.colors.primary !== 'string' ||
    typeof value.colors.secondary !== 'string' ||
    typeof value.typography.heading !== 'string' ||
    typeof value.typography.body !== 'string'
  ) {
    return null;
  }

  return {
    tagline: value.tagline,
    logoPrompt: value.logoPrompt,
    colors: {
      primary: value.colors.primary,
      secondary: value.colors.secondary,
      accent: typeof value.colors.accent === 'string' ? value.colors.accent : undefined
    },
    typography: {
      heading: value.typography.heading,
      body: value.typography.body
    }
  };
}

function sanitizeDomainResult(value: unknown): CompositeScoreInput['domainResult'] | undefined {
  if (!isPlainObject(value) || typeof value.available !== 'boolean' || typeof value.query !== 'string') {
    return undefined;
  }

  const alternates = Array.isArray(value.alternates)
    ? value.alternates
        .filter(isPlainObject)
        .filter((item) => typeof item.domain === 'string' && typeof item.available === 'boolean' && typeof item.score === 'number')
        .map((item) => ({
          domain: item.domain as string,
          available: item.available as boolean,
          score: item.score as number
        }))
    : [];

  return {
    available: value.available,
    query: value.query,
    alternates
  };
}

function sanitizeSocialResult(value: unknown): CompositeScoreInput['socialResult'] | undefined {
  if (!isPlainObject(value) || typeof value.overallScore !== 'number' || !Array.isArray(value.platforms)) {
    return undefined;
  }

  const platforms = value.platforms
    .filter(isPlainObject)
    .filter((item) => typeof item.available === 'boolean' && typeof item.platform === 'string')
    .map((item) => ({
      available: item.available as boolean,
      platform: item.platform as string
    }));

  return {
    overallScore: Math.max(0, Math.min(100, Math.round(value.overallScore))),
    platforms
  };
}

function sanitizeTrademarkResult(value: unknown): CompositeScoreInput['trademarkResult'] | undefined {
  if (!isPlainObject(value) || !isPlainObject(value.riskAssessment)) {
    return undefined;
  }

  const overallRisk = value.riskAssessment.overallRisk;
  if (overallRisk !== 'low' && overallRisk !== 'medium' && overallRisk !== 'high') {
    return undefined;
  }

  const riskFactors = Array.isArray(value.riskAssessment.riskFactors)
    ? value.riskAssessment.riskFactors.filter((item): item is string => typeof item === 'string')
    : [];
  const exactMatches = Array.isArray(value.exactMatches)
    ? value.exactMatches.map(sanitizeTrademarkMatch).filter((item): item is TrademarkMatch => item !== null)
    : [];
  const similarMatches = Array.isArray(value.similarMatches)
    ? value.similarMatches.map(sanitizeTrademarkMatch).filter((item): item is TrademarkMatch => item !== null)
    : [];

  return {
    riskAssessment: {
      overallRisk,
      riskFactors
    },
    exactMatches,
    similarMatches
  };
}

function sanitizeBrandKit(value: unknown): CompositeScoreInput['brandKit'] | undefined {
  if (!isPlainObject(value) || typeof value.brandName !== 'string') {
    return undefined;
  }

  const tonesSource = isPlainObject(value.tones) ? value.tones : undefined;
  const tones: BrandKit['tones'] | undefined = tonesSource
    ? {
        modern: tonesSource.modern === null ? null : sanitizeToneCreative(tonesSource.modern),
        playful: tonesSource.playful === null ? null : sanitizeToneCreative(tonesSource.playful),
        formal: tonesSource.formal === null ? null : sanitizeToneCreative(tonesSource.formal)
      }
    : undefined;

  const nameVariants = Array.isArray(value.nameVariants)
    ? value.nameVariants
        .filter(isPlainObject)
        .filter((item) => typeof item.value === 'string' && typeof item.score === 'number')
        .map((item) => ({
          value: item.value as string,
          score: item.score as number
        }))
    : undefined;

  return {
    brandName: value.brandName,
    nameVariants,
    tones
  };
}

export async function readJsonObject(request: NextRequest): Promise<ValidationResult<JsonObject>> {
  try {
    const body = await request.json();

    if (!isPlainObject(body)) {
      return invalid('Request body must be a JSON object');
    }

    return success(body);
  } catch {
    return invalid('Invalid JSON body');
  }
}

export function validationErrorResponse(result: ValidationFailure): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status }
  );
}

export function parseDomainCheckRequest(body: JsonObject): ValidationResult<{ domain: string }> {
  const domain = normalizeString(body.domain, 'Domain', { lowercase: true, maxLength: 253 });
  if (!domain.success) {
    return domain;
  }

  if (!COMPLETE_DOMAIN_REGEX.test(domain.data) && !NAME_ONLY_REGEX.test(domain.data)) {
    return invalid('Invalid domain format');
  }

  return success({ domain: domain.data });
}

export function parseSocialCheckRequest(body: JsonObject): ValidationResult<{ handleBase: string }> {
  const handleBase = normalizeString(body.handleBase, 'Handle base', { lowercase: true, maxLength: 30 });
  if (!handleBase.success) {
    return handleBase;
  }

  if (!SOCIAL_HANDLE_REGEX.test(handleBase.data)) {
    return invalid('Invalid handle format');
  }

  return success({ handleBase: handleBase.data });
}

export function parseTrademarkSearchRequest(
  body: JsonObject
): ValidationResult<{ brandName: string; classes: number[]; includeInternational: boolean }> {
  const brandName = normalizeString(body.brandName, 'Brand name', { maxLength: 100, minLength: 2 });
  if (!brandName.success) {
    return brandName;
  }

  const classes = parseClasses(body.classes);
  if (!classes.success) {
    return classes;
  }

  const includeInternational = parseBoolean(body.includeInternational, 'includeInternational', false);
  if (!includeInternational.success) {
    return includeInternational;
  }

  return success({
    brandName: brandName.data,
    classes: classes.data,
    includeInternational: includeInternational.data
  });
}

export function parseBrandKitRequest(body: JsonObject): ValidationResult<BrandKitInput> {
  const idea = normalizeString(body.idea, 'Idea', { maxLength: 120, minLength: 2 });
  if (!idea.success) {
    return idea;
  }

  const tone = parseOptionalTone(body.tone, 'Tone');
  if (!tone.success) {
    return tone;
  }

  const audience = parseOptionalString(body.audience, 'Audience', { maxLength: 120 });
  if (!audience.success) {
    return audience;
  }

  const domain = parseOptionalString(body.domain, 'Domain', { lowercase: true, maxLength: 253 });
  if (!domain.success) {
    return domain;
  }

  return success({
    idea: idea.data,
    tone: tone.data,
    audience: audience.data,
    domain: domain.data
  });
}

export function parseBrandKitVoiceRequest(body: JsonObject): ValidationResult<BrandKitVoiceRequest> {
  const brandName = normalizeString(body.brandName, 'brandName', { maxLength: 100, minLength: 1 });
  if (!brandName.success) {
    return brandName;
  }

  const tone = parseTone(body.tone, 'tone');
  if (!tone.success) {
    return tone;
  }

  const searchTerm = normalizeString(body.searchTerm, 'searchTerm', { maxLength: 120, minLength: 1 });
  if (!searchTerm.success) {
    return searchTerm;
  }

  const regenerate = parseBoolean(body.regenerate, 'regenerate', false);
  if (!regenerate.success) {
    return regenerate;
  }

  const audience = parseOptionalString(body.audience, 'audience', { maxLength: 120 });
  if (!audience.success) {
    return audience;
  }

  const regenerateOnly = parseOptionalSection(body.regenerateOnly);
  if (!regenerateOnly.success) {
    return regenerateOnly;
  }

  const actualValues = parseActualValues(body.actualValues);
  if (!actualValues.success) {
    return actualValues;
  }

  return success({
    brandName: brandName.data,
    tone: tone.data,
    searchTerm: searchTerm.data,
    regenerate: regenerate.data,
    audience: audience.data,
    regenerateOnly: regenerateOnly.data,
    actualValues: actualValues.data
  });
}

export function parseIPGuidanceRequest(
  body: JsonObject
): ValidationResult<{ brandName: string; categories: string[] }> {
  const brandName = normalizeString(body.brandName, 'Brand name', { maxLength: 50, minLength: 2 });
  if (!brandName.success) {
    return brandName;
  }

  const categories = parseStringArray(body.categories, 'Categories', { maxItems: 10, maxItemLength: 60 });
  if (!categories.success) {
    return categories;
  }

  return success({
    brandName: brandName.data,
    categories: categories.data
  });
}

export function parseCompositeScoreRequest(body: JsonObject): ValidationResult<CompositeScoreInput> {
  const selectedTrademarkCategory = typeof body.selectedTrademarkCategory === 'string'
    ? body.selectedTrademarkCategory.trim()
    : undefined;

  return success({
    domainResult: sanitizeDomainResult(body.domainResult),
    socialResult: sanitizeSocialResult(body.socialResult),
    trademarkResult: sanitizeTrademarkResult(body.trademarkResult),
    brandKit: sanitizeBrandKit(body.brandKit),
    selectedTrademarkCategory: selectedTrademarkCategory || undefined
  });
}
