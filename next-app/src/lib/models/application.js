import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  slug: { type: String, unique: true, sparse: true, index: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  resumeUrl: { type: String },
  cloudinaryPublicId: { type: String },
  experience: String,
  education: String,
  skills: [String],
  coverLetter: String,
  questionAnswers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    questionType: { type: String, enum: ["text", "multipleChoice", "checkbox", "file", "rating"] },
    answer: { type: mongoose.Schema.Types.Mixed },
    fileUrl: { type: String },
    cloudinaryPublicId: { type: String }
  }],
  recommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recommendation"
  },
  offerLetterId: { type: mongoose.Schema.Types.ObjectId, ref: "OfferLetter" },
  status: { 
    type: String, 
    enum: ["pending", "reviewing", "shortlisted", "rejected", "offered", "hired"], 
    default: "pending",
    index: true
  },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Application || mongoose.model("Application", applicationSchema);