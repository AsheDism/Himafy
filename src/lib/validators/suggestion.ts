import { z } from "zod";

export const suggestionRequestSchema = z.object({
  categorySlug: z.string().min(1),
  targetTimeStart: z.string().datetime().optional(),
  targetTimeEnd: z.string().datetime().optional(),
  count: z.number().int().min(1).max(5).default(3),
});

export const replanRequestSchema = z.object({
  sessionId: z.string().uuid(),
  count: z.number().int().min(1).max(5).default(3),
});

export const acceptSuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
});

export const aiSuggestionStepSchema = z.object({
  action: z.string().min(1),
  durationMin: z.number().int().positive(),
});

export const aiSuggestionItemSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  estimatedDurationMin: z.number().int().positive(),
  location: z.string().nullable().default(null),
  relatedTagSlugs: z.array(z.string()).default([]),
  steps: z.array(aiSuggestionStepSchema).default([]),
  timeSlot: z.string().nullable().default(null),
});

export const aiSuggestionResponseSchema = z.object({
  suggestions: z.array(aiSuggestionItemSchema),
});

export type SuggestionRequestInput = z.infer<typeof suggestionRequestSchema>;
export type ReplanRequestInput = z.infer<typeof replanRequestSchema>;
export type AiSuggestionItem = z.infer<typeof aiSuggestionItemSchema>;
export type AiSuggestionResponse = z.infer<typeof aiSuggestionResponseSchema>;
