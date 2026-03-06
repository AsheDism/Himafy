import type { AiGenerateParams } from "./provider";

const CATEGORY_LABELS: Record<string, string> = {
  work: "仕事・キャリア",
  hobbies: "趣味・娯楽",
  romance: "恋愛・デート",
  housework: "家事・暮らし",
  food: "食事・グルメ",
  goals: "目標・自己成長",
  personality: "性格・自分磨き",
  lifestyle: "ライフスタイル",
};

export function getCategoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] || slug;
}

export function buildSystemPrompt(params: AiGenerateParams): string {
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

export function buildUserPrompt(params: AiGenerateParams): string {
  const categoryLabel = getCategoryLabel(params.categorySlug);
  const exclude = params.excludeTitles?.length
    ? ` 除外:${params.excludeTitles.join(",")}`
    : "";
  const variation = params.variationHint ? ` 方向性:${params.variationHint}` : "";

  return `カテゴリ:${categoryLabel} タグ:${params.userTags.join(",")} ${params.count}件${exclude}${variation}
JSON:{"suggestions":[{"title":"","description":"","estimatedDurationMin":0,"location":null,"address":null,"nearestStation":null,"imageSearchQuery":"","relatedTagSlugs":[],"steps":[{"action":"","durationMin":0}],"timeSlot":null}]}`;
}
