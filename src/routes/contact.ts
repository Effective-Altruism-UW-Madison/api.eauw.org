import { Request, Response, Router } from "express";
import bodyParser from "body-parser";

import { contact } from "../queues/contact.queue";

const router = Router();

router.use(bodyParser.json());

/**
 * A Message object
 * @typedef {object} Message
 * @property {string} name.required - the first name to add to the list
 * @property {string} email.required - the email to add to the list
 * @property {string} message.required - the message to send
 * @property {string} source - the source of the subscription; defaults to "unknown"
 */

/**
 * POST /contact
 * @summary Attempts to send a contact message to the contact email address.
 * @tags contact
 * @param {Message} request.body.required - the subscription object - application/json
 * @return {object} 200 - success response - application/json
 * @example response - 200 - success response example
 * {
 *  "message": "message received."
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
      return res.status(400).json({ error: "missing name and email!" });
    }
    if (!name) {
      return res.status(400).json({ error: "missing name!" });
    }
    if (!email) {
      return res.status(400).json({ error: "missing email!" });
    }

    await contact(
      email,
      name,
      message || "No message received.",
      source || "unknown"
    );
  } catch (error: any) {
    return res.status(500).json({ error: error.toString() });
  }

  return res.status(200).json({ message: "message received." });
});

export default router;
