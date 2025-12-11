import Bull from "bull";
import nodemailer from "nodemailer";

// Redis queue
const emailQueue = new Bull("emailQueue", {
  redis: { host: "127.0.0.1", port: 6379 }
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // or any SMTP service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Process email jobs
emailQueue.process(async (job) => {
  const { to, subject, text } = job.data;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  });

  console.log("Email sent to", to);
});

export const addEmailJob = async (data) => {
  await emailQueue.add(data);
};
