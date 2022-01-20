import { Job } from "bull";
import { google } from "googleapis";

const addToSpreadsheet = async (job: Job, data: string[]) => {
  interface ProcessVariables extends NodeJS.ProcessEnv {
    API_KEY: string;
    EMAIL_LIST_SPREADSHEET_ID: string;
  }

  const { API_KEY, EMAIL_LIST_SPREADSHEET_ID } =
    process.env as ProcessVariables;

  const sheets = google.sheets({
    version: "v4",
    auth: API_KEY
  });

  function appendToSpreadsheet(
    spreadsheetId: string,
    range: string,
    values: string[][]
  ) {
    return sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: { values }
    });
  }

  const values = [[data[0], "", data[1]]];
  await appendToSpreadsheet(EMAIL_LIST_SPREADSHEET_ID, "Sheet1!A:C", values);
};

export default addToSpreadsheet;
