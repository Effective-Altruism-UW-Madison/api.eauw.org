import dotenv from "dotenv";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import expressJSDocSwagger from "express-jsdoc-swagger";

import { version } from "../package.json";
import { postEmail } from "./queues/postEmail.queue";
import { deleteEmail } from "./queues/deleteEmail.queue";
import router from "./board";

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.use(bodyParser.json());

const options = {
  info: {
    version,
    title: "Effective Altruism UW\u2013Madison API",
    description:
      "API for Effective Altruism UW\u2013Madison website and other services. \
      Facilitates newsletter sign-ups, sending emails, listing events, and more.",
    contact: {
      name: "Effective Altruism UW\u2013Madison",
      url: "https://eauw.org/",
      email: "contact@eauw.org"
    },
    license: {
      name: "Unlicense",
      url: "https://unlicense.org/"
    }
  },
  servers: [
    { url: "http://localhost:3000", description: "Development server" },
    { url: "https://api.eauw.org", description: "Production server" }
  ],
  baseDir: __dirname,
  filesPattern: "*.+(ts|js)",
  exposeSwaggerUI: true,
  swaggerUIPath: "/docs",
  exposeApiDocs: true,
  apiDocsPath: "/swagger.json",
  notRequiredAsNullable: false
};

expressJSDocSwagger(app)(options);

app.use(express.static("public"));
app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.use("/admin", router);

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
 * @example response - 200 - success response example
 * {
 *  "message": "email registered."
 * }
 * @return {object} 400 - bad request response
 * @example response - 400 - bad request response example
 * {
 *  "error": "missing email!"
 * }
 * @return {object} 500 - error response
 * @example response - 500 - error response example
 * {
 *  "error": "null has no properties"
 * }
 */
app.post("/email", async (req: Request, res: Response) => {
  try {
    const { firstName, email } = req.body;
    if (firstName === null && email === null) {
      return res.status(400).json({ error: "missing first name and email!" });
    }
    if (firstName === null) {
      return res.status(400).json({ error: "missing first name!" });
    }
    if (email === null) {
      return res.status(400).json({ error: "missing email!" });
    }
    await postEmail(email, firstName);
  } catch (error: any) {
    return res.status(500).json({ error: error.toString() });
  }

  return res.status(200).json({ message: "email registered." });
});

/**
 * DELETE /email
 * @summary Attempts to delete email from list
 *          (Google Sheets and Google Groups)
 *          by dispatching 2 queue workers.
 *          A confirmation email is also sent.
 * @tags email
 * @param {string} email.query.required - the email that we want to remove
 * @return {object} 200 - success response - application/json
 * @example response - 200 - success response example
 * {
 *  "message": "email removed."
 * }
 * @return {object} 500 - error response
 * @example response - 500 - error response example
 * {
 *  "error": "null has no properties"
 * }
 */
app.delete("/email", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (email === null) {
      return res.status(400).json({ error: "missing email!" });
    }

    await deleteEmail(email);
  } catch (error: any) {
    return res.status(500).json({ error: error.toString() });
  }

  return res.status(200).json({ message: "email removed." });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`listening on port ${PORT}`);
});
