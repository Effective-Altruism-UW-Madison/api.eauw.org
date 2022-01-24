import { Job } from "bull";
import nodemailer from "nodemailer";

const sendNewEmail = async (job: Job) => {
  const { data } = job.data;

  const ourEmail = process.env.EMAIL;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: ourEmail,
      pass: process.env.PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: ourEmail,
    to: data.email,
    subject: "subject",
    text: `Hello, ${data.firstName}`
  };
  transporter.sendMail(mailOptions);
};

export default sendNewEmail;
