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
import dotenv from "dotenv";
import { addNewEmail, serverAdapter } from "./queues/email.queue";

dotenv.config();

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

/**
 * USE /queues
 * @summary Use queue for Bull Board
 */
serverAdapter.setBasePath("/queues");
app.use("/queues", serverAdapter.getRouter());

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
      await addNewEmail(email, firstName);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.toString() });
  }
  res.status(200).json({ message: "email sent!" });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`listening on port ${PORT}`);
});
