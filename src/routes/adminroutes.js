import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { adminMiddleware } from "../middleware/adminmiddleware.js";

import {
  getAllUsers,
  updateUserRole,
  getAllJobs,
  getAllApplications,
  deleteUser,
  deleteJob,
  deleteApplication
} from "../controllers/admincontrollers.js";

const router = express.Router();

// Only authenticated + admin roles can access these routes
router.use(protect, adminMiddleware);

// USERS
router.get("/users", getAllUsers);
router.put("/users/update-role", updateUserRole);
router.delete("/users/:userId", deleteUser);

// JOBS
router.get("/jobs", getAllJobs);
router.delete("/jobs/:jobId", deleteJob);

// APPLICATIONS
router.get("/applications", getAllApplications);
router.delete("/applications/:appId", deleteApplication);

export default router;
