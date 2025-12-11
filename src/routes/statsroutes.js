import express from "express";
import { protect, recruiterOnly } from "../middleware/authMiddleware.js";
import { getRecruiterStats } from "../controllers/statscontroller.js";

const router = express.Router();

router.get("/recruiter", protect, recruiterOnly, getRecruiterStats);

export default router;
