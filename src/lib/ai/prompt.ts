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
  let prompt = `あなたはHimafyの予定提案AIです。日本語でJSON応答してください。
ユーザーの空き時間に合った、"今日すぐ実行できる"具体的で実在する場所・店名を使った予定を提案してください。
各提案の「予算感(budgetMin, budgetMax)」を円単位で必ず数値で推測して回答に含めてください。無料(0円)の場合のみ両方0にします。
imageSearchQueryは必ず英語で、場所名がある場合は「場所名 特徴」(例:"Blue Bottle Coffee Shibuya","Yoyogi Park cherry blossom","Tsukiji fish market")、場所なしなら活動の英語キーワードを設定してください。

## 出力ルール（厳守）
各提案は以下のJSON形式で返してください:
{
  "title": "動詞で始まる具体的なタイトル（20字以内）",
  "description": "なぜこのユーザーにおすすめかの理由（50字以内）",
  "steps": [
    { "action": "具体的なアクション", "duration": "15分" }
  ],
  "location": "場所名（自宅/具体名/公園名/オンライン）",
  "address": "住所（わかれば）",
  "nearestStation": "最寄り駅（わかれば）",
  "timeSlot": "14:00〜15:30",
  "totalMinutes": 90,
  "budgetMin": 1000,
  "budgetMax": 2000,
  "imageSearchQuery": "search query in english",
  "relatedTags": ["追加候補のタグ"]
}

## 禁止事項
- 「〜について学ぶ」のような抽象的な提案
- 空き時間を超える所要時間の提案
- 提案が同じタイプ（例:全部読書）にならないこと
- バリエーションを確保すること`;

  if (params.freeSlots && params.freeSlots.length > 0) {
    const slots = params.freeSlots.map((s) => {
      const fmt = (d: Date) => `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
      return `${fmt(new Date(s.start))}〜${fmt(new Date(s.end))}`;
    });
    prompt += `\n\n## 空き時間情報\n- ${slots.join(", ")}\n※提案のtimeSlotはこの範囲内に収めてください。`;
  }

  if (params.feedbackContext && params.feedbackContext.totalFeedbacks > 0) {
    const fc = params.feedbackContext;
    prompt += `\n\n## ユーザーの好み（過去のフィードバックから）`;
    if (fc.highRated.length > 0) prompt += `\n- 高評価の傾向: ${fc.highRated.join(", ")}`;
    if (fc.lowRated.length > 0) prompt += `\n- 避けるべき傾向: ${fc.lowRated.join(", ")}`;
    prompt += `\n→ 高評価に近い提案を優先し、低評価傾向は避けてください。`;
  }

  return prompt;
}

export function buildUserPrompt(params: AiGenerateParams): string {
  const categoryLabel = getCategoryLabel(params.categorySlug);
  const exclude = params.excludeTitles?.length
    ? `\n- 除外タイトル: ${params.excludeTitles.join(", ")}`
    : "";
  const variation = params.variationHint ? `\n- 方向性: ${params.variationHint}` : "";

  return `以下の条件で ${params.count}件 の予定を提案してください。
- カテゴリ: ${categoryLabel}
- ユーザータグ: ${params.userTags.join(", ")}${exclude}${variation}

回答は {"suggestions": [...]} の形式のJSONのみを出力してください。`;
}
