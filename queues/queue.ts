import Bull from "bull";
// Error: setQueues and BullAdapter not being imported from bull-board
import { setQueues, BullAdapter } from "bull-board";

const emailProcess = async (job: Bull.Job) => job.data;

// Error: not sure what REDIS_URL is supposed to be
const emailQueue = new Bull("email", {
  redis: process.env.REDIS_URL
});

setQueues([
  new BullAdapter(emailQueue)
]);

emailQueue.process(emailProcess);

const sendNewEmail = (data: any) => {
  emailQueue.add(data, {
    attempts: 5
  });
};

export default sendNewEmail;
