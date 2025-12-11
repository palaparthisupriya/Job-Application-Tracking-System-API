import express from "express";
import { createJob, getJobs } from "../controllers/jobcontroller.js";
import { protect, authorize } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/", protect, authorize("recruiter"), createJob);
router.get("/", protect, getJobs);

export default router;
