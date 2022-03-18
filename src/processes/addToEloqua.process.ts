import { Job } from "bull";
import fetch from "node-fetch";
import qs from "qs";

const addToEloqua = async (job: Job) => {
  const options = {
    method: "POST",
    qs: { LP: "1028" },
    headers: {
      "Host": "explore.wisc.edu",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://explore.wisc.edu/EAM-email-preferences",
      "Content-Type": "application/x-www-form-urlencoded",
      "Origin": "https://explore.wisc.edu",
      "DNT": "1",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-User": "?1",
      "Pragma": "no-cache",
      "Cache-Control": "no-cache"
    },
    body: qs.stringify({
      elqFormName: "EAMsubscriptionmanagementform",
      elqSiteId: "1427524768",
      elqCampaignId: "",
      Email: job.data.email,
      MOVINGeneral: "on",
      hiddenField: "EAM"
    })
  };

  job.log(`Adding ${job.data.email} to Eloqua...`);

  fetch("https://explore.wisc.edu/e/f2", options)
    .then((res) => Promise.all([res.status, res.text()]))
    .then(([status, data]) => {
      if (status === 200 && !data.includes("A problem has occurred")) {
        job.progress(100);
        job.log(`Added ${job.data.email} to Eloqua.`);
      } else {
        job.log('Got response "A problem has occurred with this form."');
        job.log(`Failed to add ${job.data.email} to Eloqua.`);
        job.moveToFailed({ message: data.replace(/<(.|\n)*?>/g, "") }, true);
      }
    })
    .catch((err) => {
      job.log(`Failed to add ${job.data.email} to Eloqua.`);
      job.moveToFailed(err, true);
    });
};

export default addToEloqua;
