import { Job } from "bull";
import { google } from "googleapis";

const addToGroups = async (job: Job, data: string[]) => {
  interface ProcessVariables extends NodeJS.ProcessEnv {
    API_KEY: string;
    GROUP_KEY: string;
  }

  const { API_KEY, GROUP_KEY } = process.env as ProcessVariables;

  // const auth = new google.auth.GoogleAuth({
  //   keyFile: "./google-key.json",
  //   scopes: [
  //     // "https://www.googleapis.com/auth/admin.directory.group",
  //     // "https://www.googleapis.com/auth/admin.directory.group.member",
  //     "https://www.googleapis.com/auth/drive",
  //     "https://www.googleapis.com/auth/drive.file",
  //     "https://www.googleapis.com/auth/spreadsheets"
  //   ]
  // });

  const admin = google.admin({
    version: "directory_v1",
    auth: API_KEY
  });

  function addToGroup(groupKey: string, address: string) {
    return admin.members.insert({
      groupKey,
      requestBody: {
        email: address,
        role: "MEMBER"
      }
    });
  }

  await addToGroup(GROUP_KEY, data[0]);
};

export default addToGroups;
