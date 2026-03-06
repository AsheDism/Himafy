import { z } from "zod";

export const feedbackSchema = z.object({
  suggestionId: z.string().uuid(),
  satisfaction: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
