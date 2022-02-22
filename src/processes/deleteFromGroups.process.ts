import { Job } from "bull";
import { google } from "googleapis";
import process from "process";

const deleteFromGroups = async (job: Job) => {
  const SCOPES = [
    "https://www.googleapis.com/auth/admin.directory.group",
    "https://www.googleapis.com/auth/admin.directory.group.member"
  ];

  const auth = new google.auth.JWT({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: SCOPES,
    subject: process.env.GOOGLE_WORKSPACE_ADMIN_ACCOUNT
  });

  const admin = google.admin({
    version: "directory_v1",
    auth
  });

  const address: string = job.data.email;

  job.progress(50);
  job.log(`Removing ${address} from group...`);
  admin.members
    .delete({
      groupKey: process.env.GROUP_ID,
      memberKey: address
    })
    .then(() => {
      job.progress(100);
      job.log(`Removed ${address} from group.`);
    })
    .catch((err) => {
      job.log(`Failed to remove ${address} from group.`);
      job.moveToFailed(err, true);
    });
};

export default deleteFromGroups;
