import { Job } from "bull";
import { google } from "googleapis";
import process from "process";

const deleteFromSpreadsheet = async (job: Job) => {
  const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

  const auth = new google.auth.JWT({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: SCOPES,
    subject: process.env.GOOGLE_WORKSPACE_ADMIN_ACCOUNT
  });

  const sheets = google.sheets({
    version: "v4",
    auth
  });

  const deleteFromSpreadsheetHelper = (
    spreadsheetId: string,
    range: string,
    email: string
  ) => {
    job.progress(50);
    job.log("Removing from spreadsheet...");

    sheets.spreadsheets.values.get(
      {
        spreadsheetId,
        range
      },
      (err, result) => {
        if (err) {
          job.log(`Failed to remove ${email} from group.`);
          job.moveToFailed(
            { message: "Could not grab spreadsheet values." },
            true
          );
        } else {
          const values = result?.data.values;
          if (values === undefined || values === null || values?.length === 0) {
            job.log(`Failed to remove ${email} from group.`);
            job.moveToFailed(
              { message: "Could not grab spreadsheet values." },
              true
            );
          } else {
            // find row with email within 2D array values
            const row: number =
              values.findIndex((arr) => arr.includes(email)) + 1;

            sheets.spreadsheets
              .batchUpdate({
                spreadsheetId,
                requestBody: {
                  requests: [
                    {
                      deleteRange: {
                        range: {
                          sheetId: 0,
                          startRowIndex: row - 1, // exclusive
                          endRowIndex: row // inclusive
                        },
                        shiftDimension: "ROWS"
                      }
                    }
                  ]
                }
              })
              .then(() => {
                job.progress(100);
                job.log("Spreadsheet updated.");
              })
              // eslint-disable-next-line no-shadow
              .catch((err: any) => {
                job.log(`Failed to remove ${email} from group.`);
                job.moveToFailed(err, true);
              });
          }
        }
      }
    );
  };

  // "EAM" is a proprietary contact label required for Eloqua.
  // Remove if necessary.
  const search = job.data.email;

  if (process.env.SPREADSHEET_ID !== undefined) {
    deleteFromSpreadsheetHelper(
      process.env.SPREADSHEET_ID,
      "Sheet1!A:D",
      search
    );
  } else {
    job.moveToFailed({ message: "SPREADSHEET_ID not defined" }, true);
  }
};

export default deleteFromSpreadsheet;
