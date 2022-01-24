/* eslint-disable camelcase */
/* eslint-disable consistent-return */
import { Job } from "bull";
import fs from "fs";
import readline from "readline";
import { google } from "googleapis";

const addToSpreadsheet = async (job: Job) => {
  const { data } = job.data;

  interface ProcessVariables extends NodeJS.ProcessEnv {
    API_KEY: string;
    EMAIL_LIST_SPREADSHEET_ID: string;
  }

  const { API_KEY, EMAIL_LIST_SPREADSHEET_ID } =
    process.env as ProcessVariables;

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  // If modifying these scopes, delete token.json.
  const SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets"
  ];
  // The file token.json stores the user's access and refresh tokens, and is
  // created automatically when the authorization flow completes for the first
  // time.
  const tokenPath = "token.json";

  function storeToken(token: any) {
    fs.writeFile(tokenPath, JSON.stringify(token), (error: any) => {
      if (error) return console.warn(`Token not stored to ${tokenPath}`, error);
      console.log(`Token stored to ${tokenPath}`);
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  function getNewToken(oauth2Client: any, callback: any) {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES
    });
    console.log("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question("Enter the code from that page here: ", (code) => {
      rl.close();
      oauth2Client.getToken(code, (error: any, token: any) => {
        if (error) return console.error("Error retrieving access token", error);
        // eslint-disable-next-line no-param-reassign
        oauth2Client.credentials = token;
        storeToken(token);
        callback(oauth2Client);
      });
    });
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials: any, callback: any) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oauth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile(tokenPath, (error: any, token: any) => {
      if (error) return getNewToken(oauth2Client, callback);
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    });
  }

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

  // Load client secrets from a local file.
  fs.readFile("credentials.json", (error: any, content: any) => {
    if (error) return console.error("Error loading client secret file", error);

    // Authorize a client with the loaded credentials, then call the
    // Directory API.
    authorize(JSON.parse(content), appendToSpreadsheet);
  });

  const values = [[data.email, "", data.firstName]];
  await appendToSpreadsheet(EMAIL_LIST_SPREADSHEET_ID, "Sheet1!A:C", values);
};

export default addToSpreadsheet;
