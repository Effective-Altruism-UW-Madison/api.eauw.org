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
} */

import express from "express";
import bodyParser from "body-parser";
import { google } from "googleapis";
import dotenv from "dotenv";
// import swaggerJSDoc from "swagger-jsdoc";
// import swaggerUi from "swagger-ui-express";

dotenv.config();

const PORT = 3000;
const { API_KEY, GROUP_KEY } = process.env;
const app = express();
app.use(bodyParser.json());

// const swaggerOptions = {
//   swaggerDefinition: {
//     info: {
//       title: "Email API",
//       description: "Email API Information",
//       contact: {
//         name: "Effective Altruism UW-Madison",
//         url: "https://eauw.org/",
//         email: "contact@eauw.org"
//       },
//       servers: ["http://localhost:3000"]
//     }
//   },
//   apis: ["index.js"]
// };
// const swaggerDocs = swaggerJSDoc(swaggerOptions);
// app.use("/docs", swaggerUi.serve, swaggerui.setup(swaggerDocs));

const sheets = google.sheets({
  version: "v4",
  auth: API_KEY
});

function addToGroup(groupKey, email) {
  // eslint-disable-next-line no-undef
  return fetch(
    `https://admin.googleapis.com/admin/directory/v1/groups/${GROUP_KEY}/members`,
    {
      method: "POST",
      body: JSON.stringify({
        email,
        role: "MEMBER"
      })
    }
  );
}

function appendToSpreadsheet(spreadsheetId, range, values) {
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
 *  get:
 *    description: Use to add to the email list
 *    responses:
 *      '200':
 *        description: Successful response
 *      '400':
 *        description: Missing value error response
 *      '500':
 *        description: Miscellaneous error
 */
app.post("/email", async (req, res) => {
  try {
    const { firstName, email } = req.body;
    const emailListSpreadsheetId = process.env.EMAIL_LIST_SPREADSHEET_ID;
    if (firstName == null && email == null) {
      res.status(400).json({ error: "missing first name and email!" });
    } else if (firstName == null) {
      res.status(400).json({ error: "missing first name!" });
    } else if (email == null) {
      res.status(400).json({ error: "missing email!" });
    } else {
      const values = [[email, "", firstName]];
      await appendToSpreadsheet(emailListSpreadsheetId, "Sheet1!A:C", values);
      // TO DO: get group key
      await addToGroup(GROUP_KEY, email);
      res.status(200).json({ message: "email sent!" });
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`listening on port ${PORT}`);
});
