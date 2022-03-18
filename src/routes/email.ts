import { Request, Response, Router } from "express";
import bodyParser from "body-parser";

import { postEmail } from "../queues/postEmail.queue";
import { deleteEmail } from "../queues/deleteEmail.queue";

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
    const { firstName, email, source } = req.body;
    if (!firstName && !email) {
      return res.status(400).json({ error: "missing first name and email!" });
    }
    if (!firstName) {
      return res.status(400).json({ error: "missing first name!" });
    }
    if (!email) {
      return res.status(400).json({ error: "missing email!" });
    }
    await postEmail(email, firstName, source || "unknown");
  } catch (error: any) {
    return res.status(500).json({ error: error.toString() });
  }

  return res.status(200).json({ message: "email registered." });
});

/**
 * DELETE /email
 * @summary Attempts to delete email from list
 *          (Google Sheets, Google Groups, and Eloqua)
 *          by dispatching a queue worker.
 * @tags email
 * @param {Unsubscription} request.body.required - the unsubscription object - application/json
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
router.delete("/", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "missing email!" });
    }

    await deleteEmail(email);
  } catch (error: any) {
    return res.status(500).json({ error: error.toString() });
  }

  return res.status(200).json({ message: "email removed." });
});

/**
 * GET /email/unsubscribe
 * @summary Renders the unsubscribe page which sends a request to DELETE /email.
 * @tags email
 * @param {string} email.query - the email that we want to remove
 */
router.get("/unsubscribe", async (req: Request, res: Response) => {
  try {
    const address = req.query.address as string;
    return res.render("unsubscribe", { address });
  } catch (error: any) {
    return res.status(500).json({ error: error.toString() });
  }
});

export default router;
