import { Request, Response, Router } from "express";
import bodyParser from "body-parser";

import { contact } from "../queues/contact.queue";

const router = Router();

router.use(bodyParser.json());

/**
 * A subscription object
 * @typedef {object} Subscription
 * @property {string} firstName.required - the first name to add to the list
 * @property {string} email.required - the email to add to the list
 * @property {string} source - the source of the subscription; defaults to "unknown"
 */

/**
 * An unsubscription object
 * @typedef {object} Unsubscription
 * @property {string} email.required - the email to remove from the list
 */

/**
 * POST /email
 * @summary Attempts to add email to list
 *          (Google Sheets, Google Groups, and Eloqua)
 *          by dispatching a queue worker.
 *          A confirmation email is also sent.
 * @tags email
 * @param {Subscription} request.body.required - the subscription object - application/json
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
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, message, source } = req.body;
    if (!name && !email) {
      return res.status(400).json({ error: "missing first name and email!" });
    }
    if (!name) {
      return res.status(400).json({ error: "missing first name!" });
    }
    if (!email) {
      return res.status(400).json({ error: "missing email!" });
    }
    await contact(email, name, message, source || "unknown");
  } catch (error: any) {
    return res.status(500).json({ error: error.toString() });
  }

  return res.status(200).json({ message: "contact success." });
});

export default router;
