import express from "express";
import {
  submitApplication,
  changeApplicationStage,
  getMyApplications,
  getApplicationsForJob,
  getApplicationDetail,
} from "../controllers/applicationcontroller.js";
import { getApplicationHistory } from "../controllers/applicationcontroller.js";
import { getCandidateStats } from "../controllers/statscontroller.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Candidate submits application
router.post("/submit", protect, authorize("candidate"), submitApplication);

// Recruiter changes stage
router.post("/change-stage", protect, authorize("recruiter"), changeApplicationStage);

// Candidate views their own applications
router.get("/my", protect, authorize("candidate"), getMyApplications);

// Recruiter views all applications for a job (optional stage filter)
router.get("/job/:jobId", protect, authorize("recruiter"), getApplicationsForJob);

// View single application detail (candidate or recruiter)
router.get("/:id", protect, getApplicationDetail);
router.get('/:id/history', protect, getApplicationHistory);
router.get("/candidate", protect, getCandidateStats);


export default router;
