import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiProvider, AiGenerateParams, AiSuggestionResult } from "./provider";

function buildSystemPrompt(params: AiGenerateParams): string {
  let prompt = `予定提案AI。日本語でJSON応答。具体的な実在の場所・店名を使う。imageSearchQueryは必ず英語で、場所名がある場合は「場所名 特徴」(例:"Blue Bottle Coffee Shibuya","Yoyogi Park cherry blossom","Tsukiji fish market")、場所なしなら活動の英語キーワード。stepsは5-8個で具体的な行動を細かく書く(例:"駅から店まで徒歩移動","メニューを選ぶ","注文する","写真を撮る","食べる","会計")。バリエーション確保。`;

  if (params.freeSlots && params.freeSlots.length > 0) {
    const slots = params.freeSlots.map((s) => {
      const fmt = (d: Date) => `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      return `${fmt(new Date(s.start))}-${fmt(new Date(s.end))}`;
    });
    prompt += `\n空き:${slots.join(",")}。timeSlotをHH:MM〜HH:MMで設定。`;
  }

  if (params.feedbackContext && params.feedbackContext.totalFeedbacks > 0) {
    const fc = params.feedbackContext;
    if (fc.highRated.length > 0) prompt += `\n好み:${fc.highRated.join(",")}`;
    if (fc.lowRated.length > 0) prompt += `\n避ける:${fc.lowRated.join(",")}`;
  }

  return prompt;
}

export class GeminiProvider implements AiProvider {
  name = "gemini";
  model = "gemini-2.5-flash";
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generateSuggestions(params: AiGenerateParams): Promise<AiSuggestionResult> {
    const exclude = params.excludeTitles?.length
      ? ` 除外:${params.excludeTitles.join(",")}`
      : "";

    const userPrompt = `${params.categorySlug} タグ:${params.userTags.join(",")} ${params.count}件${exclude}
JSON:{"suggestions":[{"title":"","description":"","estimatedDurationMin":0,"location":null,"address":null,"nearestStation":null,"imageSearchQuery":"","relatedTagSlugs":[],"steps":[{"action":"","durationMin":0}],"timeSlot":null}]}`;

    const systemPrompt = buildSystemPrompt(params);

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
