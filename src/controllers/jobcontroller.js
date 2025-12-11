import Job from "../models/job.js";

// Create job
export const createJob = async (req, res) => {
  try {
    const { title, description, companyId } = req.body;

    const job = await Job.create({ title, description, companyId });

    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get all jobs
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
