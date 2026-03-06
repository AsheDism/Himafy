import { google, calendar_v3 } from "googleapis";
import { getOAuth2Client } from "./google-auth";

function getCalendarClient(accessToken: string) {
  const auth = getOAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth });
}

export async function listEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<calendar_v3.Schema$Event[]> {
  const calendar = getCalendarClient(accessToken);
  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items || [];
}

export async function createEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    startTime: string;
    endTime: string;
  }
): Promise<calendar_v3.Schema$Event> {
  const calendar = getCalendarClient(accessToken);
  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: "Asia/Tokyo",
      },
      end: {
        dateTime: event.endTime,
        timeZone: "Asia/Tokyo",
      },
    },
  });
  return res.data;
}
