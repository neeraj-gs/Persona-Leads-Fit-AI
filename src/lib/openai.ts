import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cost per 1M tokens for GPT-4o-mini (as of 2024)
// Input: $0.15 per 1M tokens
// Output: $0.60 per 1M tokens
export const OPENAI_PRICING = {
  'gpt-4o-mini': {
    input: 0.15 / 1_000_000,
    output: 0.60 / 1_000_000,
  },
  'gpt-4o': {
    input: 2.50 / 1_000_000,
    output: 10.00 / 1_000_000,
  },
  'gpt-4-turbo': {
    input: 10.00 / 1_000_000,
    output: 30.00 / 1_000_000,
  },
} as const;

export type OpenAIModel = keyof typeof OPENAI_PRICING;

export function calculateCost(
  model: OpenAIModel,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = OPENAI_PRICING[model];
  return inputTokens * pricing.input + outputTokens * pricing.output;
}
