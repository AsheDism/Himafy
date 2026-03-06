import { z } from "zod";

export const userTagSourceSchema = z.enum([
  "onboarding",
  "post_selection",
  "manual",
]);

export const addUserTagsSchema = z.object({
  tagIds: z.array(z.number().int().positive()).min(1),
  source: userTagSourceSchema.default("manual"),
});

export const removeUserTagSchema = z.object({
  tagId: z.number().int().positive(),
});

export type AddUserTagsInput = z.infer<typeof addUserTagsSchema>;
export type RemoveUserTagInput = z.infer<typeof removeUserTagSchema>;
