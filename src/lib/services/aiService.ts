export interface AIConfig {
  provider: 'openai' | 'claude' | 'anthropic' | 'mock';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AIPrompt {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async generateContent(prompt: AIPrompt): Promise<string> {
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAI(prompt);
        case 'claude':
        case 'anthropic':
          return await this.callClaude(prompt);
      case 'mock':
        throw new Error('Mock AI not allowed. Please configure a real AI provider (OpenAI or Claude).');
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      throw error;
    }
  }

  private async callOpenAI(prompt: AIPrompt): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not provided');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: prompt.system },
          { role: 'user', content: prompt.user }
        ],
        max_tokens: prompt.maxTokens || 500,
        temperature: prompt.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callClaude(prompt: AIPrompt): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('Claude API key not provided');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: prompt.maxTokens || 500,
        temperature: prompt.temperature || 0.7,
        messages: [
          { role: 'user', content: `${prompt.system}\n\n${prompt.user}` }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  // REMOVED: Mock AI - NO SIMULATED DATA ALLOWED

  // REMOVED: All simulation methods - NO SIMULATED DATA ALLOWED
}
