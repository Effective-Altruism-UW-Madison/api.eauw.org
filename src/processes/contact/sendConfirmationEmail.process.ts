import { Job } from "bull";
// import nodemailer from "nodemailer";
// import path from "path";
// import fs from "fs";
// import handlebars from "handlebars";

import { Message } from "../../common/types";

const sendConfirmationEmail = async (job: Job<Message>) => {
  job.log("Sending email...");
};

export default sendConfirmationEmail;
