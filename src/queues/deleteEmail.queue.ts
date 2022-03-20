import Bull, { Job } from "bull";

import deleteFromGroups from "../processes/deleteFromGroups.process";
import deleteFromSpreadsheet from "../processes/deleteFromSpreadsheet.process";
import deleteFromEloqua from "../processes/deleteFromEloqua.process";
import slackNotification from "../processes/slackNotification.process";

import { Unsubscription } from "../common/types";

const deleteEmailQueue = new Bull(
  "DELETE /email",
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

const GROUPS_PROCESS_NAME = "Delete from Google Groups";
const SPREADSHEET_PROCESS_NAME = "Delete from Google Spreadsheet";
const ELOQUA_PROCESS_NAME = "Delete from Eloqua";
const SLACK_NOTIFICATION_PROCESS_NAME = "Send Slack Notification";

deleteEmailQueue.process(GROUPS_PROCESS_NAME, (job: Job) =>
  deleteFromGroups(job)
);
deleteEmailQueue.process(SPREADSHEET_PROCESS_NAME, (job: Job) =>
  deleteFromSpreadsheet(job)
);
deleteEmailQueue.process(ELOQUA_PROCESS_NAME, (job: Job) =>
  deleteFromEloqua(job)
);
deleteEmailQueue.process(SLACK_NOTIFICATION_PROCESS_NAME, (job: Job) =>
  slackNotification(job)
);

const createJob = (name: string, data: Unsubscription) => {
  deleteEmailQueue.add(name, data, {
    attempts: 3
  });
};

const deleteEmail = async (email: string) => {
  const data: Unsubscription = {
    email
  };
  // createJob(GROUPS_PROCESS_NAME, data);
  // createJob(SPREADSHEET_PROCESS_NAME, data);
  // createJob(ELOQUA_PROCESS_NAME, data);
  createJob(SLACK_NOTIFICATION_PROCESS_NAME, data);
};

export { deleteEmail, deleteEmailQueue };
