import Bull from "bull";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";

import sendNewEmail from "../processes/email.process";
import addToGroups from "../processes/groups.process";
import addToSpreadsheet from "../processes/spreadsheet.process";

interface ProcessVariables extends NodeJS.ProcessEnv {
  REDIS_URL: string;
}

const { REDIS_URL } = process.env as ProcessVariables;

const queue = new Bull("emailQueue", REDIS_URL);

const serverAdapter = new ExpressAdapter();

const {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setQueues,
  replaceQueues,
  addQueue,
  removeQueue
} = createBullBoard({
  queues: [new BullAdapter(queue)],
  serverAdapter
});

const createJob = (options: any, data: any) => {
  const opts = { priority: 0, attempts: 5 };
  queue.add(options, data, {
    attempts: opts.attempts,
    backoff: {
      type: "exponential",
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: true
  });
};

queue.process("Add To Groups", (job) => addToGroups(job.data));
queue.process("Add To Spreadsheet", (job) => addToSpreadsheet(job.data));
queue.process("Send New Email", (job) => sendNewEmail(job.data));

async function addNewEmail(email: string, firstName: string) {
  const data = {
    email: `${email}`,
    firstName: `${firstName}`
  };
  createJob("Add to Groups", data);
  createJob("Add To Spreadsheet", data);
  createJob("Send New Email", data);
}

export { addNewEmail, serverAdapter };
