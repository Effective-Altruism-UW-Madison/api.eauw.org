import Bull, { Job } from "bull";

import addToGroups from "../processes/addToGroups.process";
import addToSpreadsheet from "../processes/addToSpreadsheet.process";
import addToEloqua from "../processes/addToEloqua.process";
import sendConfirmationEmail from "../processes/sendConfirmationEmail.process";
import slackNotification from "../processes/slackNotification.process";

import { Subscription } from "../common/types";

const postEmailQueue = new Bull(
  "POST /email",
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

const GROUPS_PROCESS_NAME = "Add to Google Groups";
const SPREADSHEET_PROCESS_NAME = "Add to Google Spreadsheet";
const ELOQUA_PROCESS_NAME = "Add to Eloqua";
const CONFIRMATION_EMAIL_PROCESS_NAME = "Send Confirmation Email";
const SLACK_NOTIFICATION_PROCESS_NAME = "Send Slack Notification";

postEmailQueue.process(GROUPS_PROCESS_NAME, (job: Job) => addToGroups(job));
postEmailQueue.process(SPREADSHEET_PROCESS_NAME, (job: Job) =>
  addToSpreadsheet(job)
);
postEmailQueue.process(ELOQUA_PROCESS_NAME, (job: Job) => addToEloqua(job));
postEmailQueue.process(CONFIRMATION_EMAIL_PROCESS_NAME, (job: Job) =>
  sendConfirmationEmail(job)
);
postEmailQueue.process(SLACK_NOTIFICATION_PROCESS_NAME, (job: Job) =>
  slackNotification(job)
);

const createJob = (name: string, data: Subscription) => {
  postEmailQueue.add(name, data, {
    attempts: 3
  });
};

const postEmail = async (email: string, firstName: string, source: string) => {
  const data: Subscription = {
    email,
    firstName,
    source
  };
  // createJob(GROUPS_PROCESS_NAME, data);
  // createJob(SPREADSHEET_PROCESS_NAME, data);
  // createJob(ELOQUA_PROCESS_NAME, data);
  // createJob(CONFIRMATION_EMAIL_PROCESS_NAME, data);
  createJob(SLACK_NOTIFICATION_PROCESS_NAME, data);
};

export { postEmail, postEmailQueue };
