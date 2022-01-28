import { Job } from "bull";
import nodemailer from "nodemailer";

const sendConfirmationEmail = async (job: Job) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  job.progress(50);
  job.log(`Attempting to authenticate as ${process.env.SMTP_USER}...`);

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: job.data.email,
    subject: "subject",
    text: `Hello, ${job.data.firstName}`
  };

  job.log("Sending email...");

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

export default sendConfirmationEmail;
