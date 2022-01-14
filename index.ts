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

- Authenticate for Google Groups
- Fix Swagger documentation
- Implement queue

*/

import fs from "fs";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import swaggerJSDoc, { Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { google } from "googleapis";
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

const swaggerOptions: Options = {
  swaggerDefinition: {
    info: {
      title: "Email API",
      description: "Email API Information",
      contact: {
        name: "Effective Altruism UW–Madison",
        url: "https://eauw.org/",
        email: "contact@eauw.org"
      },
      servers: [
        { url: "http://localhost:3000", description: "Development server" },
        { url: "https://api.eauw.org", description: "Production server" }
      ],
      version: "0.1"
    }
  },
  apis: ["index.ts"]
};
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const auth = new google.auth.GoogleAuth({
  keyFile: "./google-key.json",
  scopes: [
    // "https://www.googleapis.com/auth/admin.directory.group",
    // "https://www.googleapis.com/auth/admin.directory.group.member",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/spreadsheets"
  ]
});

const sheets = google.sheets({
  version: "v4",
  auth: API_KEY
});

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
 *    description: Attempts to add email to list
 *                 (Google Sheets and Google Groups)
 *                 by dispatching a queue worker.
 *                 A confirmation email is also sent.
 *    parameters:
 *      - in: body
 *        name: request
 *        required: true
 *        description: Email request
 *        schema:
 *          type: object
 *          required:
 *            - firstName
 *            - email
 *        properties:
 *          firstName:
 *            type: string
 *            description: First name of person
 *            example: "Peter"
 *          email:
 *            type: string
 *            description: Email address of person
 *            example: "singer@eauw.org"
 *    responses:
 *      '200':
 *        description: Email was received and queue worker was dispatched
 *      '400':
 *        description: Field validation error
 *      '500':
 *        description: Internal server error
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

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`listening on port ${PORT}`);
});
