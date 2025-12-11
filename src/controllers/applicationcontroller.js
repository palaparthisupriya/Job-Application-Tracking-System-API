import Application from "../models/applicationmodel.js";
import ApplicationHistory from "../models/applicationhistory.js";
import Job from "../models/job.js";
import User from "../models/user.js";
import { addEmailJob } from "../workers/emailworker.js";

// Valid stage transitions
const validTransitions = {
  Applied: ["Screening", "Rejected"],
  Screening: ["Interview", "Rejected"],
  Interview: ["Offer", "Rejected"],
  Offer: ["Hired", "Rejected"],
  Hired: [],
  Rejected: [],
};

// ----------------------------------------------
// @desc Candidate submits an application
// @route POST /api/applications/submit
// ----------------------------------------------
export const submitApplication = async (req, res) => {
  try {
    const { jobId } = req.body;
    const candidateId = req.user._id;

    // Get job
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // Check if already applied
    const already = await Application.findOne({ candidate: candidateId, job: jobId });
    if (already) return res.status(400).json({ message: "Already applied" });

    // Create application
    const application = await Application.create({
      candidate: candidateId,
      job: jobId,
      stage: "Applied",
    });

    // Fetch recruiter for email
    const recruiter = await User.findById(job.postedBy);
    const candidate = await User.findById(candidateId);

    // Send emails asynchronously
    await addEmailJob({
      to: candidate.email,
      subject: "Application Submitted",
      text: `Your application for ${job.title} has been submitted.`,
    });

    await addEmailJob({
      to: recruiter.email,
      subject: "New Application Received",
      text: `${candidate.name} has applied for your job posting "${job.title}".`,
    });

    res.status(201).json({ message: "Application submitted", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// @desc Recruiter changes application stage
// @route PUT /api/applications/:id/stage
// ----------------------------------------------
export const changeApplicationStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStage } = req.body;

    const application = await Application.findById(id)
      .populate("candidate", "email name")
      .populate("job", "title");

    if (!application) return res.status(404).json({ message: "Application not found" });

    const currentStage = application.stage;

    // Validate transition
    if (!validTransitions[currentStage].includes(newStage)) {
      return res.status(400).json({
        message: `Invalid transition from ${currentStage} → ${newStage}`,
      });
    }

    // Update stage
    application.stage = newStage;
    await application.save();

    // Save history
    await ApplicationHistory.create({
      application: id,
      fromStage: currentStage,
      toStage: newStage,
      changedAt: new Date(),
    });

    // Send update email
    await addEmailJob({
      to: application.candidate.email,
      subject: "Application Status Updated",
      text: `Your application for ${application.job.title} is now at stage: ${newStage}.`,
    });

    res.json({ message: "Stage updated", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// @desc Get single application details
// ----------------------------------------------------
export const getApplicationDetail = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("candidate", "name email role")
      .populate("job", "title description companyId");

    if (!application) return res.status(404).json({ message: "Application not found" });

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// @desc Recruiter views all applications for a job
// @route GET /api/applications/job/:jobId?stage=Interview
// ----------------------------------------------------
export const getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { stage } = req.query;

    let filter = { job: jobId };
    if (stage) filter.stage = stage;

    const applications = await Application.find(filter)
      .populate("candidate", "name email")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// @desc Candidate views their own applications
// ----------------------------------------------------
export const getMyApplications = async (req, res) => {
  try {
    const candidateId = req.user._id;

    const applications = await Application.find({ candidate: candidateId })
      .populate("job", "title description companyId")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getApplicationHistory = async (req, res) => {
    try {
      const { id } = req.params;
  
      const history = await ApplicationHistory.find({ application: id })
        .sort({ timestamp: 1 }); // oldest → newest
  
      if (!history.length) {
        return res.status(404).json({ message: "No history found" });
      }
  
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  // ⭐ CANDIDATE DASHBOARD SUMMARY
export const getCandidateStats = async (req, res) => {
    try {
      const candidateId = req.user._id;
  
      // 1. Total applications submitted
      const totalApplications = await Application.countDocuments({ candidate: candidateId });
  
      // 2. Applications grouped by stage
      const applicationsByStage = await Application.aggregate([
        { $match: { candidate: candidateId } },
        {
          $group: {
            _id: "$stage",
            count: { $sum: 1 }
          }
        }
      ]);
  
      // 3. Recent applications (latest 5)
      const recentApplications = await Application.find({ candidate: candidateId })
        .populate("job", "title companyId")
        .sort({ createdAt: -1 })
        .limit(5);
  
      res.json({
        totalApplications,
        applicationsByStage,
        recentApplications
      });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  