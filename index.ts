/* Intended request example:

curl --request POST \
  --url https://api.eauw.org/email \
  --header 'Content-Type: application/json' \
  --data '{
  "firstName": "Peter",
  "email": "singer@eauw.org"
}'

Intended response example:

{
  "response": "email sent!"
}

TO DO:

- Complete authentication
  - Adjust functions for TypeScript by specifying necessary parameter types
  - Replace console logs
- Complete queue
  - Include add to email list process

*/

import fs from "fs";
import readline from "readline";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import swaggerJSDoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { google } from "googleapis";
// Error: router not being imported from bull-board
import { router } from "bull-board";
import dotenv from "dotenv";

dotenv.config();

interface ProcessVariables extends NodeJS.ProcessEnv {
  API_KEY: string;
  GROUP_KEY: string;
  EMAIL_LIST_SPREADSHEET_ID: string;
}

const { API_KEY, GROUP_KEY, EMAIL_LIST_SPREADSHEET_ID } =
  process.env as ProcessVariables;

const PORT = 3000;

const app = express();
app.use(bodyParser.json());
app.use("/admin/queues", router);

const swaggerOptions = {
  swaggerDefinition: {
    info: {
      title: "Email API",
      description: "Email API Information",
      contact: {
        name: "Effective Altruism UW-Madison",
        url: "https://eauw.org/",
        email: "contact@eauw.org"
      },
      servers: ["http://localhost:3000"]
    }
  },
  apis: ["index.ts"]
};
// Error: type error
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const SCOPES = ["https://www.googleapis.com/auth/admin.directory.user"];
const TOKEN_PATH = "token.json";

// Error: need to define the types here for typescript, but not sure exactly what types go in
function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    // Error: need to define the types here for typescript, but not sure exactly what types go in
    oauth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

// Error: need to define the types here for typescript, but not sure exactly what types go in
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oauth2Client, callback);
    oauth2Client.credentials = JSON.parse(token);
    callback(oauth2Client);
  });
}

const admin = google.admin({
  version: "directory_v1",
  auth: API_KEY
});

function addToGroup(groupKey: string, email: string) {
  return admin.members.insert({
    groupKey,
    requestBody: {
      email,
      role: "MEMBER"
    }
  });
}

fs.readFile("credentials.json", (err, content) => {
  if (err) return console.error("Error loading client secret file", err);
  authorize(JSON.parse(content), addToGroup);
});

function storeToken(token) {
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) return console.warn(`Token not stored to ${TOKEN_PATH}`, err);
    console.log(`Token stored to ${TOKEN_PATH}`);
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

/**
 * @swagger
 * /email:
 *  post:
 *    description: Use to add to the email list
 *    responses:
 *      '200':
 *        description: Successful response
 *      '400':
 *        description: Missing value error response
 *      '500':
 *        description: Miscellaneous error
 */
app.post("/email", async (req: Request, res: Response) => {
  try {
    const { firstName, email } = req.body;
    if (firstName == null && email == null) {
      res.status(400).json({ error: "missing first name and email!" });
    } else if (firstName == null) {
      res.status(400).json({ error: "missing first name!" });
    } else if (email == null) {
      res.status(400).json({ error: "missing email!" });
    } else {
      const values = [[email, "", firstName]];
      await appendToSpreadsheet(
        EMAIL_LIST_SPREADSHEET_ID,
        "Sheet1!A:C",
        values
      );
      await addToGroup(GROUP_KEY, email);
      res.status(200).json({ message: "email sent!" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  }
});

/**
 * @swagger
 * /email:
 *  post:
 *    description: Use to add to the email list
 *    responses:
 *      '200':
 *        description: Successful response
 */
app.post("/send-email", async (req, res) => {
  const { message, ...restBody } = req.body;
  // Error: sendNewEmail not exporting from queue.ts properly
  await sendNewEmail({
    ...restBody,
    html: `<p>${message}</p>`
  });
  res.status(200).json({ message: "message sent!" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`listening on port ${PORT}`);
});
