import { z } from "zod";

export const calendarEventSchema = z.object({
  summary: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});

export type CalendarEventInput = z.infer<typeof calendarEventSchema>;
