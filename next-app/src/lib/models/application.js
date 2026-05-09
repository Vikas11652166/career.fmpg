import mongoose from 'mongoose';

const slugBase = (value) => {
  return (value || 'application')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'application';
};

const alphaSuffix = (index) => {
  if (index <= 0) return '';
  let n = index;
  let out = '';
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
};

const ensureUniqueSlug = async (model, base, selfId) => {
  let attempt = 0;
  while (true) {
    const suffix = alphaSuffix(attempt);
    const candidate = suffix ? `${base}-${suffix}` : base;
    const conflict = await model.findOne({
      slug: candidate,
      _id: { $ne: selfId }
    }).select('_id');
    if (!conflict) return candidate;
    attempt += 1;
  }
};

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
  isReferred: { type: Boolean, default: false },
  recommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recommendation"
  },
  questionAnswers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    questionType: { type: String, enum: ["text", "multipleChoice", "checkbox", "file", "rating"] },
    answer: { type: mongoose.Schema.Types.Mixed },
    fileUrl: { type: String },
    cloudinaryPublicId: { type: String }
  }],
  status: { 
    type: String, 
    enum: ["pending", "reviewing", "shortlisted", "rejected", "offered", "hired"], 
    default: "pending",
    index: true
  },
  offerLetterId: { type: mongoose.Schema.Types.ObjectId, ref: "OfferLetter" },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for status and date filtering
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ jobId: 1, status: 1 });

applicationSchema.pre('validate', async function() {
  if (!this.slug || this.isModified('fullName')) {
    const base = slugBase(this.fullName);
    this.slug = await ensureUniqueSlug(this.constructor, base, this._id);
  }
});

const Application = mongoose.models.Application || mongoose.model("Application", applicationSchema);
export default Application;