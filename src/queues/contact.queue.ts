import Bull, { Job } from "bull";

import sendMessage from "../processes/contact/sendMessage.process";

import { Message } from "../common/types";

const MESSAGE_PROCESS_NAME = `Send Message to ${process.env.CONTACT_EMAIL_ADDRESS}`;

const contactQueue = new Bull(
  "POST /contact",
  process.env.REDIS_URL || "redis://127.0.0.1:6379"
);

contactQueue.process(MESSAGE_PROCESS_NAME, (job: Job<Message>) =>
  sendMessage(job)
);

const createJob = (name: string, data: Message) => {
  contactQueue.add(name, data, {
    attempts: 3
  });
};

const contact = async (
  email: string,
  name: string,
  message: string,
  source: string
) => {
  const data: Message = {
    email,
    name,
    message,
    source
  };
  createJob(MESSAGE_PROCESS_NAME, data);
};

export { contact, contactQueue };
