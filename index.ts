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

// import fs from "fs";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import expressJSDocSwagger from "express-jsdoc-swagger";
import { google } from "googleapis";
import dotenv from "dotenv";

import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";

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

const options = {
  info: {
    version: "0.0.1",
    title: "Effective Altruism UW–Madison API",
    description:
      "API for Effective Altruism UW–Madison website and other services. \
      Facilitates newsletter sign-ups, sending emails, listing events, and more.",
    contact: {
      name: "Effective Altruism UW–Madison",
      url: "https://eauw.org/",
      email: "contact@eauw.org"
    },
    license: {
      name: "MIT"
    }
  },
  servers: [
    { url: "http://localhost:3000", description: "Development server" },
    { url: "https://api.eauw.org", description: "Production server" }
  ],
  baseDir: __dirname,
  filesPattern: "*.ts",
  exposeSwaggerUI: true,
  swaggerUIPath: "/docs",
  exposeApiDocs: true,
  apiDocsPath: "/swagger.json",
  notRequiredAsNullable: false
};

expressJSDocSwagger(app)(options);

// const auth = new google.auth.GoogleAuth({
//   keyFile: "./google-key.json",
//   scopes: [
//     // "https://www.googleapis.com/auth/admin.directory.group",
//     // "https://www.googleapis.com/auth/admin.directory.group.member",
//     "https://www.googleapis.com/auth/drive",
//     "https://www.googleapis.com/auth/drive.file",
//     "https://www.googleapis.com/auth/spreadsheets"
//   ]
// });

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

const ourEmail = process.env.EMAIL;

const transporter = nodemailer.createTransport({
  host: process.env.HOSTNAME,
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    type: 'OAuth2',
    user: ourEmail,
    pass: process.env.PASS,
    clientId: process.env.OAUTH_CLIENTID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN
  }
});

/**
 * POST /email
 * @summary Attempts to add email to list
 *          (Google Sheets and Google Groups)
 *          by dispatching a queue worker.
 *          A confirmation email is also sent.
 * @tags email
 * @param {string} firstName.query.required - the first name to add to the list
 * @param {string} email.query.required - the email to add to the list
 * @return {object} 200 - success response - application/json
 * @return {object} 400 - Bad request response
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
      const mailOptions = {
        from: ourEmail,
        to: email,
        subject: 'subject',
        text: ''
      };
      transporter.sendMail(mailOptions, (error: any) => {
        res.status(500).json({ error: error.toString() });
      });
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
