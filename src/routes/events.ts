import { Request, Response, Router } from "express";
import { google } from "googleapis";

const router = Router();

async function listEvents() {
  // read-only calendar access
  const SCOPES = ["https://www.googleapis.com/auth/calendar.events.readonly"];

  const auth = new google.auth.JWT({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: SCOPES,
    subject: process.env.GOOGLE_WORKSPACE_ADMIN_ACCOUNT
  });

  const calendar = google.calendar({
    version: "v3",
    auth
  });

  const res = await calendar.events.list({
    calendarId: "contact@eauw.org",
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime"
  });
  return res.data.items;
}

/**
 * GET /events
 * @summary Fetch events from Google Calendar API
 * @tags events
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    await console.log(JSON.stringify(listEvents()));

    // return events

    return res.status(200).json({ message: "events fetched." });
  } catch (error: any) {
    return res.status(500).json({ error: error.toString() });
  }
});

export default router;
