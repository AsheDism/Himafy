import OpenAI from "openai";
import type { AiProvider, AiGenerateParams, AiSuggestionResult } from "./provider";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

export class OpenAiProvider implements AiProvider {
  name = "openai";
  model = "gpt-4o-mini";
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async generateSuggestions(params: AiGenerateParams): Promise<AiSuggestionResult> {
    const systemPrompt = buildSystemPrompt(params);
    const userPrompt = buildUserPrompt(params);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    }, { timeout: 30000 });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(content);

    const suggestions = (parsed.suggestions || []).map((s: Record<string, unknown>) => ({
      title: s.title as string,
      description: s.description as string,
      estimatedDurationMin: (s.totalMinutes as number) || (s.estimatedDurationMin as number) || 0,
      location: (s.location as string) || null,
      address: (s.address as string) || null,
      nearestStation: (s.nearestStation as string) || null,
      imageSearchQuery: (s.imageSearchQuery as string) || "",
      relatedTagSlugs: (s.relatedTags as string[]) || (s.relatedTagSlugs as string[]) || [],
      steps: (Array.isArray(s.steps) ? s.steps : []).map((step: Record<string, unknown>) => ({
        action: step.action as string,
        durationMin: typeof step.duration === 'string'
          ? parseInt(step.duration.replace(/[^0-9]/g, ''), 10) || 0
          : ((step.durationMin as number) || 0)
      })),
      timeSlot: (s.timeSlot as string) || null,
      budgetMin: (s.budgetMin as number) ?? 0,
      budgetMax: (s.budgetMax as number) ?? 0,
    }));

    return {
      suggestions,
      provider: this.name,
      model: this.model,
    };
  }
}
