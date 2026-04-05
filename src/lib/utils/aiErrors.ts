type AIProvider = 'anthropic' | 'claude' | 'openai';

type PublicAIError = {
  body: {
    code: string;
    error: string;
    message: string;
    retryAfterSeconds?: number;
    retryable: boolean;
  };
  status: number;
};

export class AIProviderError extends Error {
  readonly code?: string;
  readonly provider: AIProvider;
  readonly providerMessage: string;
  readonly retryAfterSeconds?: number;
  readonly status: number;

  constructor(options: {
    code?: string;
    provider: AIProvider;
    providerMessage: string;
    retryAfterSeconds?: number;
    status: number;
  }) {
    super(`${formatProviderName(options.provider)} API error (${options.status})`);
    this.name = 'AIProviderError';
    this.code = options.code;
    this.provider = options.provider;
    this.providerMessage = options.providerMessage;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.status = options.status;
  }
}

function formatProviderName(provider: AIProvider): string {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
    case 'claude':
      return 'Anthropic';
  }
}

function normalizeFeatureLabel(featureLabel: string): string {
  return featureLabel.trim() || 'This feature';
}

function parseRetryAfterSeconds(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue >= 0) {
    return Math.ceil(numericValue);
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  const secondsUntilRetry = Math.ceil((timestamp - Date.now()) / 1000);
  return secondsUntilRetry > 0 ? secondsUntilRetry : undefined;
}

export function createAIProviderError(options: {
  code?: string;
  provider: AIProvider;
  providerMessage: string;
  response: Response;
}): AIProviderError {
  return new AIProviderError({
    code: options.code,
    provider: options.provider,
    providerMessage: options.providerMessage,
    retryAfterSeconds: parseRetryAfterSeconds(options.response.headers.get('retry-after')),
    status: options.response.status
  });
}

export function toPublicAIError(error: unknown, featureLabel: string): PublicAIError {
  const feature = normalizeFeatureLabel(featureLabel);

  if (error instanceof AIProviderError) {
    if (error.status === 429) {
      return {
        status: 503,
        body: {
          code: 'ai_temporarily_unavailable',
          error: `${feature} is unavailable right now.`,
          message: 'The AI provider is rate limiting requests. Please try again in a minute.',
          retryAfterSeconds: error.retryAfterSeconds,
          retryable: true
        }
      };
    }

    if (error.status >= 500) {
      return {
        status: 503,
        body: {
          code: 'ai_provider_unavailable',
          error: `${feature} is unavailable right now.`,
          message: 'The AI provider is temporarily unavailable. Please try again shortly.',
          retryAfterSeconds: error.retryAfterSeconds,
          retryable: true
        }
      };
    }

    return {
      status: 503,
      body: {
        code: 'ai_request_failed',
        error: `${feature} is unavailable right now.`,
        message: 'The AI request could not be completed. Please try again later.',
        retryAfterSeconds: error.retryAfterSeconds,
        retryable: error.status === 408
      }
    };
  }

  if (error instanceof Error) {
    if (
      error.message.includes('AI_API_KEY is required') ||
      error.message.includes('API key not provided')
    ) {
      return {
        status: 503,
        body: {
          code: 'ai_not_configured',
          error: `${feature} is unavailable right now.`,
          message: 'The AI service is not configured correctly.',
          retryable: false
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      code: 'ai_unknown_error',
      error: `${feature} is unavailable right now.`,
      message: 'An unexpected error occurred. Please try again later.',
      retryable: false
    }
  };
}
