import Queue from "bull";
import nodemailer from "nodemailer";

// Redis URL from environment
const emailQueue = new Queue("email-queue", process.env.REDIS_URL);

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Queue processor
emailQueue.process(async (job) => {
  try {
    const { to, subject, text } = job.data;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });

    console.log(`📧 Email successfully sent to ${to}`);
  } catch (error) {
    console.error("❌ Email job failed:", error.message);

    // Throw error so Bull retries automatically
    throw error;
  }
});

// Function to add job to queue
export const addEmailJob = async (emailData) => {
  await emailQueue.add(emailData, {
    attempts: 3, // Retry 3 times on failure
    backoff: {
      type: "exponential", // exponential backoff
      delay: 5000, // initial 5s
    },
    removeOnComplete: true, // remove job after success
    removeOnFail: false,   // keep failed job for inspection
  });
};
