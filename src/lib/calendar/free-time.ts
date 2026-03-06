import { calendar_v3 } from "googleapis";

type TimeSlot = {
  start: Date;
  end: Date;
};

const MIN_SLOT_MINUTES = 30;
const DAY_START_HOUR = 8; // 8:00 JST
const DAY_END_HOUR = 23; // 23:00 JST

export function calculateFreeSlots(
  events: calendar_v3.Schema$Event[],
  date: Date
): TimeSlot[] {
  // Build day boundaries in JST
  const dayStart = new Date(date);
  dayStart.setHours(DAY_START_HOUR, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(DAY_END_HOUR, 0, 0, 0);

  // Extract busy periods from events
  const busy: TimeSlot[] = events
    .map((e) => {
      const start = e.start?.dateTime
        ? new Date(e.start.dateTime)
        : e.start?.date
          ? new Date(e.start.date)
          : null;
      const end = e.end?.dateTime
        ? new Date(e.end.dateTime)
        : e.end?.date
          ? new Date(e.end.date)
          : null;
      if (!start || !end) return null;
      return { start, end };
    })
    .filter((s): s is TimeSlot => s !== null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Find gaps
  const slots: TimeSlot[] = [];
  let cursor = dayStart;

  for (const event of busy) {
    if (event.start > cursor && event.start <= dayEnd) {
      const slotEnd = event.start < dayEnd ? event.start : dayEnd;
      if (slotEnd > cursor) {
        const durationMin =
          (slotEnd.getTime() - cursor.getTime()) / (1000 * 60);
        if (durationMin >= MIN_SLOT_MINUTES) {
          slots.push({ start: new Date(cursor), end: slotEnd });
        }
      }
    }
    if (event.end > cursor) {
      cursor = new Date(event.end);
    }
  }

  // After last event until day end
  if (cursor < dayEnd) {
    const durationMin =
      (dayEnd.getTime() - cursor.getTime()) / (1000 * 60);
    if (durationMin >= MIN_SLOT_MINUTES) {
      slots.push({ start: new Date(cursor), end: dayEnd });
    }
  }

  return slots;
}
