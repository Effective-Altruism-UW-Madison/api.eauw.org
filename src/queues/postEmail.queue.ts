import Bull from "bull";

import addToGroups from "../processes/addToGroups.process";
import addToSpreadsheet from "../processes/addToSpreadsheet.process";
import addToEloqua from "../processes/addToEloqua.process";
import sendConfirmationEmail from "../processes/sendConfirmationEmail.process";

const postEmailQueue = new Bull(
  "POST /email",
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

const GROUPS_PROCESS_NAME = "Add to Google Groups";
const SPREADSHEET_PROCESS_NAME = "Add to Google Spreadsheet";
const ELOQUA_PROCESS_NAME = "Add to Eloqua";
const CONFIRMATION_EMAIL_PROCESS_NAME = "Send Confirmation Email";

postEmailQueue.process(GROUPS_PROCESS_NAME, (job: any) => addToGroups(job));
postEmailQueue.process(SPREADSHEET_PROCESS_NAME, (job: any) =>
  addToSpreadsheet(job)
);
postEmailQueue.process(ELOQUA_PROCESS_NAME, (job: any) => addToEloqua(job));
postEmailQueue.process(CONFIRMATION_EMAIL_PROCESS_NAME, (job: any) =>
  sendConfirmationEmail(job)
);

const createJob = (name: string, data: any) => {
  postEmailQueue.add(name, data, {
    attempts: 3
  });
};

const postEmail = async (email: string, firstName: string, source: string) => {
  const data = {
    email,
    firstName,
    source
  };
  createJob(GROUPS_PROCESS_NAME, data);
  createJob(SPREADSHEET_PROCESS_NAME, data);
  createJob(ELOQUA_PROCESS_NAME, data);
  createJob(CONFIRMATION_EMAIL_PROCESS_NAME, data);
};

export { postEmail, postEmailQueue };
