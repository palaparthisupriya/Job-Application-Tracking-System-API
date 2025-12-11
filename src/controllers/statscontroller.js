import Job from "../models/job.js";
import Application from "../models/applicationmodel.js";

export const getRecruiterStats = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    // 1. Get jobs posted by this recruiter
    const jobs = await Job.find({ recruiterId });

    const jobIds = jobs.map(job => job._id);

    // 2. Count applications for these jobs
    const totalApplications = await Application.countDocuments({
      job: { $in: jobIds }
    });

    // 3. Group applications by stage
    const applicationsByStage = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Applications per job
    const applicationsPerJob = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      {
        $group: {
          _id: "$job",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalJobs: jobs.length,
      totalApplications,
      applicationsByStage,
      applicationsPerJob
    });
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
