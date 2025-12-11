import mongoose from "mongoose";

const applicationHistorySchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    previousStage: { type: String },
    newStage: { 
      type: String, 
      enum: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"] 
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("ApplicationHistory", applicationHistorySchema);
