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
dotenv.config();

const PORT = 3000;
// TO DO: GET API KEY
const API_KEY = process.env.API_KEY;
const app = express();
app.use(bodyParser.json());

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

app.get("/api/v1/addEmail", async (req, res) => {
    const { firstName, email } = req.body;
    const emailListSpreadsheetId = process.env.EMAIL_LIST_SPREADSHEET_ID;
    const values = [[email, "", firstName]];
    await appendToSpreadsheet(emailListSpreadsheetId, "Sheet1!A:C", values);
    res.json({ response: "email sent!" });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
