import { Job } from "bull";
// import { WebClient } from "@slack/web-api";

import { Subscription, Unsubscription } from "../common/types";

/**
 * A user-defined type guard that checks if a job is a subscription job.
 * @param job
 * @returns true if job is a subscription, false otherwise
 */
const isSubscription = (
  job: Job<Subscription> | Job<Unsubscription>
): job is Job<Subscription> =>
  (job as Job<Subscription>).data.firstName !== undefined;

const slackNotification = async (
  job: Job<Subscription> | Job<Unsubscription>
) => {
  // // Read a token from the environment variables
  // const token = process.env.SLACK_TOKEN;

  // // Initialize
  // const web = new WebClient(token);

  if (isSubscription(job)) {
    console.log(`Subscription: ${job.data.firstName}`);

    // using the Slack JavaScript SDK, send a message to the #subscriptions channel
    // https://slack.dev/node-slack-sdk/web-api
    // https://api.slack.com/methods/chat.postMessage
    // await web.chat.postMessage({
    //   channel: "#subscriptions",
    //   text: `New subscription: ${job.data.firstName} ${job.data.email}`
    // });
  } else {
    console.log(`Unsubscription: ${job.data.email}`);
    // await web.chat.postMessage({
    //   channel: "#subscriptions",
    //   text: `Unsubscription: ${job.data.email}`
    // });
  }
};

export default slackNotification;
