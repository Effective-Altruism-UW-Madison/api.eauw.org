import { Job } from "bull";

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
  if (isSubscription(job)) {
    console.log(`Subscription: ${job.data.firstName}`);
  } else {
    console.log(`Unsubscription: ${job.data.email}`);
  }
};

export default slackNotification;
