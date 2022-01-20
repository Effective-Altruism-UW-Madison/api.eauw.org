import { Job } from "bull";
import nodemailer from "nodemailer";

const sendNewEmail = async (job: Job, data: string[]) => {
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
    to: data[0],
    subject: "subject",
    text: `Hello, ${data[1]}`
  };
  transporter.sendMail(mailOptions);
};

export default sendNewEmail;
