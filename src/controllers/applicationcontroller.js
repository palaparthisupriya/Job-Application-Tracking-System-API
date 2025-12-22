import mongoose from "mongoose";
import Application from "../models/applicationmodel.js";
import ApplicationHistory from "../models/applicationhistory.js";
import Job from "../models/job.js";
import User from "../models/user.js";
import { addEmailJob } from "../workers/emailworker.js";

// ----------------------------------------------
// Valid stage transitions (Finite State Machine)
// ----------------------------------------------
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

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const alreadyApplied = await Application.findOne({
      candidate: candidateId,
      job: jobId,
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    const application = await Application.create({
      candidate: candidateId,
      job: jobId,
      stage: "Applied",
    });

    // Fetch users for email
    const candidate = await User.findById(candidateId);
    const recruiter = await User.findById(job.postedBy);

    // Async email notifications
    await addEmailJob({
      to: candidate.email,
      subject: "Application Submitted",
      text: `Your application for ${job.title} has been submitted successfully.`,
    });

    await addEmailJob({
      to: recruiter.email,
      subject: "New Job Application",
      text: `${candidate.name} has applied for your job: ${job.title}`,
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// @desc Recruiter changes application stage
// @route PUT /api/applications/:id/stage
// ----------------------------------------------
export const changeApplicationStage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { newStage } = req.body;

    const application = await Application.findById(id)
      .populate("candidate", "email name")
      .populate("job", "title")
      .session(session);

    if (!application) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Application not found" });
    }

    const currentStage = application.stage;

    if (!validTransitions[currentStage].includes(newStage)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Invalid transition from ${currentStage} → ${newStage}`,
      });
    }

    // 1️⃣ Update stage
    application.stage = newStage;
    await application.save({ session });

    // 2️⃣ Log history (atomic)
    await ApplicationHistory.create(
      [
        {
          application: id,
          fromStage: currentStage,
          toStage: newStage,
          changedAt: new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // 3️⃣ Send email AFTER transaction commit
    await addEmailJob({
      to: application.candidate.email,
      subject: "Application Status Updated",
      text: `Your application for ${application.job.title} is now in stage: ${newStage}.`,
    });

    res.json({
      message: "Application stage updated successfully",
      application,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// @desc Get single application details
// ----------------------------------------------
export const getApplicationDetail = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate("candidate", "name email role")
      .populate("job", "title description companyId");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// @desc Recruiter views applications for a job
// @route GET /api/applications/job/:jobId
// ----------------------------------------------
export const getApplicationsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { stage } = req.query;

    const filter = { job: jobId };
    if (stage) filter.stage = stage;

    const applications = await Application.find(filter)
      .populate("candidate", "name email")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// @desc Candidate views own applications
// ----------------------------------------------
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

// ----------------------------------------------
// @desc Get application history
// ----------------------------------------------
export const getApplicationHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await ApplicationHistory.find({ application: id })
      .sort({ changedAt: 1 });

    if (!history.length) {
      return res.status(404).json({ message: "No history found" });
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------
// @desc Candidate dashboard stats
// ----------------------------------------------
export const getCandidateStats = async (req, res) => {
  try {
    const candidateId = req.user._id;

    const totalApplications = await Application.countDocuments({
      candidate: candidateId,
    });

    const applicationsByStage = await Application.aggregate([
      { $match: { candidate: candidateId } },
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
        },
      },
    ]);

    const recentApplications = await Application.find({
      candidate: candidateId,
    })
      .populate("job", "title companyId")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalApplications,
      applicationsByStage,
      recentApplications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
