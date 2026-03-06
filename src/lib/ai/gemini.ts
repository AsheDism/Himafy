import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiProvider, AiGenerateParams, AiSuggestionResult } from "./provider";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

export class GeminiProvider implements AiProvider {
  name = "gemini";
  model = "gemini-2.5-flash";
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateSuggestions(params: AiGenerateParams): Promise<AiSuggestionResult> {
    const systemPrompt = buildSystemPrompt(params);
    const userPrompt = buildUserPrompt(params);

    const model = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.8,
        // @ts-expect-error -- thinkingConfig is supported by 2.5 but not yet in SDK types
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const result = await Promise.race([
      model.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout (30s)")), 30000)
      ),
    ]);

    const content = result.response.text();
    if (!content) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(content);

    const suggestions = (parsed.suggestions || []).map((s: Record<string, unknown>) => ({
      title: s.title as string,
      description: s.description as string,
      estimatedDurationMin: s.estimatedDurationMin as number,
      location: (s.location as string) || null,
      address: (s.address as string) || null,
      nearestStation: (s.nearestStation as string) || null,
      imageSearchQuery: (s.imageSearchQuery as string) || "",
      relatedTagSlugs: (s.relatedTagSlugs as string[]) || [],
      steps: Array.isArray(s.steps) ? s.steps : [],
      timeSlot: (s.timeSlot as string) || null,
    }));

    return {
      suggestions,
      provider: this.name,
      model: this.model,
    };
  }
}
