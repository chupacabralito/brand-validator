# AI Integration Setup

The Brand Validator uses real AI providers for generating creative taglines and brand content.

## Supported AI Providers

### 1. OpenAI (GPT)
```bash
# Add to your .env file
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-key
AI_MODEL=gpt-3.5-turbo
```

### 2. Claude (Anthropic)
```bash
# Add to your .env file
AI_PROVIDER=claude
AI_API_KEY=sk-ant-your-claude-key
AI_MODEL=claude-3-haiku-20240307
```

## Environment Variables

Create a `.env.local` file in the project root with:

```env
# AI Configuration
AI_PROVIDER=openai
AI_API_KEY=your_api_key_here
AI_MODEL=gpt-4o-mini
AI_BASE_URL=

# Database (optional)
DATABASE_URL="file:./dev.db"

# Analytics (optional)
ANALYTICS_ENABLED=true
```

## How It Works

1. **AI Provider Selection**: Set `AI_PROVIDER` to choose your AI service
2. **No Mock Mode**: A real provider key is required for Brand Kit generation
3. **Context-Aware**: AI receives context about industry, concept, and target audience
4. **Smart Parsing**: Handles both JSON and text responses from AI

## Testing

1. Get an API key from your chosen provider
2. Add it to your `.env.local` file
3. Set the appropriate `AI_PROVIDER`
4. Restart the development server

## Cost Considerations

- **OpenAI GPT-3.5**: ~$0.001 per request
- **Claude Haiku**: ~$0.00025 per request



