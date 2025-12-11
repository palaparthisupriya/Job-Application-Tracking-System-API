import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    candidate: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    job: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Job", 
      required: true 
    },
    stage: { 
      type: String, 
      enum: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"], 
      default: "Applied" 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Application", applicationSchema);
