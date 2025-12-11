import User from "../models/user.js";
import Job from "../models/job.js";
import Application from "../models/applicationmodel.js";

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

// CHANGE ROLE
export const updateUserRole = async (req, res) => {
  const { userId, role } = req.body;

  const validRoles = ["student", "recruiter", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  );

  res.json({ message: "Role updated", user });
};

// GET ALL JOBS
export const getAllJobs = async (req, res) => {
  const jobs = await Job.find().populate("createdBy", "name email");
  res.json(jobs);
};

// GET ALL APPLICATIONS
export const getAllApplications = async (req, res) => {
  const apps = await Application.find()
    .populate("userId", "name email")
    .populate("jobId", "title company");

  res.json(apps);
};

// DELETE USER
export const deleteUser = async (req, res) => {
  const { userId } = req.params;
  await User.findByIdAndDelete(userId);
  res.json({ message: "User deleted" });
};

// DELETE JOB
export const deleteJob = async (req, res) => {
  const { jobId } = req.params;
  await Job.findByIdAndDelete(jobId);
  res.json({ message: "Job deleted" });
};

// DELETE APPLICATION
export const deleteApplication = async (req, res) => {
  const { appId } = req.params;
  await Application.findByIdAndDelete(appId);
  res.json({ message: "Application deleted" });
};
