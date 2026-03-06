import type { AiProvider, AiGenerateParams } from "./provider";
import { OpenAiProvider } from "./openai";
import { GeminiProvider } from "./gemini";

const providers: AiProvider[] = [];

function getProviders(): AiProvider[] {
  if (providers.length === 0) {
    // Gemini first: faster JSON output than OpenAI for this use case
    if (process.env.GEMINI_API_KEY) {
      providers.push(new GeminiProvider());
    }
    if (process.env.OPENAI_API_KEY) {
      providers.push(new OpenAiProvider());
    }
  }
  return providers;
}

export async function getAiProvider(): Promise<AiProvider> {
  const available = getProviders();
  if (available.length === 0) {
    throw new Error("No AI provider configured");
  }
  return available[0];
}

export async function generateWithFallback(params: AiGenerateParams) {
  const available = getProviders();
  const errors: string[] = [];

  if (available.length === 0) {
    throw new Error("No AI provider configured. Check OPENAI_API_KEY and GEMINI_API_KEY env vars.");
  }

  for (const provider of available) {
    try {
      return await provider.generateSuggestions(params);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[AI Factory] ${provider.name} (${provider.model}) failed:`, msg);
      errors.push(`${provider.name}: ${msg}`);
      continue;
    }
  }

  throw new Error(`All AI providers failed: ${errors.join(" | ")}`);
}
