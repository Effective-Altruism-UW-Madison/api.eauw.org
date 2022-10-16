import { Job } from "bull";
import nodemailer from "nodemailer";
import path from "path";
import fs from "fs";
import handlebars from "handlebars";

import { Message } from "../../common/types";

const sendMessage = async (job: Job<Message>) => {
  job.log("Defining email settings based on environment variables...");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  job.progress(25);
  job.log("Fetching HTML template...");

  /* 
    filePath works in both development and production because
    production builds the project into ·dist/· and development
    uses ·src/·, which are both at the root of the project
  */
  const filePath = path.join(__dirname, "../../../assets/Message.html");
  const source = fs.readFileSync(filePath, "utf-8").toString();
  const template = handlebars.compile(source);

  const replacements = {
    name: job.data.name,
    message: job.data.message
  };

  job.progress(50);
  job.log("Replacing fields...");

  const html = template(replacements);

  const mailOptions = {
    from: `EA UW Leadership Team <${process.env.SMTP_USER}>`,
    to: job.data.email,
    bcc: process.env.CONTACT_EMAIL_ADDRESS,
    subject: `💡 We got your message, ${job.data.name}!`,
    html
  };

  job.log("Sending email...");
  job.log(`Attempting to authenticate as ${process.env.SMTP_USER}...`);

  transporter
    .sendMail(mailOptions)
    .then(() => {
      job.progress(100);
      job.log("Email sent.");
    })
    .catch((err) => {
      job.log("Failed to send email.");
      job.moveToFailed(err, true);
    });
};

export default sendMessage;
