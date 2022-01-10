/* Intended request example:

curl --request GET \
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
import swaggerJSDoc from "swagger-jsdoc";
dotenv.config();

const PORT = 3000;
const API_KEY = process.env.API_KEY;
const app = express();
app.use(bodyParser.json());

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
  apis: ["index.js"]
}
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerui.setup(swaggerDocs));

const sheets = google.sheets({ 
    version: "v4",
    auth: API_KEY,
});

function appendToSpreadsheet(spreadsheetId, range, values) {
    return sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: values },
    });
};

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
 */
app.get("/email", async (req, res) => {
    const { firstName, email } = req.body;
    const emailListSpreadsheetId = process.env.EMAIL_LIST_SPREADSHEET_ID;
    if (firstName == null && email == null) {
      res.json({ response: "400 Bad Request: missing first name and email!" });
    } else if (firstName == null) {
      res.json({ response: "400 Bad Request: missing first name!" });
    } else if (email == null) {
      res.json({ response: "400 Bad Request: missing email address!" });
    } else {
      const values = [[email, "", firstName]];
      await appendToSpreadsheet(emailListSpreadsheetId, "Sheet1!A:C", values);
      res.json({ response: "email sent!" });
    }
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
