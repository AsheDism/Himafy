export interface FreeSlot {
  start: string; // ISO string
  end: string;
  durationMin: number;
}

export interface FeedbackContext {
  highRated: string[];   // titles of suggestions rated 4-5
  lowRated: string[];    // titles of suggestions rated 1-2
  avgSatisfaction: number | null;
  totalFeedbacks: number;
}

export interface AiSuggestionStep {
  action: string;
  durationMin: number;
}

export interface AiSuggestionItem {
  title: string;
  description: string;
  estimatedDurationMin: number;
  location: string | null;
  address: string | null;
  nearestStation: string | null;
  imageSearchQuery: string;
  relatedTagSlugs: string[];
  steps: AiSuggestionStep[];
  timeSlot: string | null; // e.g. "14:00〜15:30"
  budgetMin: number;
  budgetMax: number;
}

export interface AiSuggestionResult {
  suggestions: AiSuggestionItem[];
  provider: string;
  model: string;
}

export interface AiGenerateParams {
  categorySlug: string;
  userTags: string[];
  count: number;
  excludeTitles?: string[];
  freeSlots?: FreeSlot[];
  feedbackContext?: FeedbackContext;
  variationHint?: string;
}

export interface AiProvider {
  name: string;
  model: string;
  generateSuggestions(params: AiGenerateParams): Promise<AiSuggestionResult>;
}
