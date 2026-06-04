import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestionAnswer {
  questionId?: mongoose.Types.ObjectId;
  questionText?: string;
  questionType?: "text" | "multipleChoice" | "checkbox" | "file" | "rating";
  answer?: any;
  fileUrl?: string;
  cloudinaryPublicId?: string;
}

export interface IApplication extends Document {
  slug?: string;
  jobId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  resume?: string;
  resumeUrl?: string;
  cloudinaryPublicId?: string;
  experience?: string;
  education?: string;
  skills: string[];
  coverLetter?: string;
  isReferred: boolean;
  referrerName?: string;
  referrerEmail?: string;
  referralMessage?: string;
  recommendationId?: mongoose.Types.ObjectId;
  questionAnswers: IQuestionAnswer[];
  status: "pending" | "reviewing" | "shortlisted" | "rejected" | "offered" | "hired";
  hrNotes?: string;
  offerLetter?: string;
  offerLetterId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const slugBase = (value: string): string => {
  return (value || "application")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "application";
};

const alphaSuffix = (index: number): string => {
  if (index <= 0) return "";
  let n = index;
  let out = "";
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode(97 + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
};

const ensureUniqueSlug = async (
  model: Model<IApplication>,
  base: string,
  selfId: any
): Promise<string> => {
  let attempt = 0;
  while (true) {
    const suffix = alphaSuffix(attempt);
    const candidate = suffix ? `${base}-${suffix}` : base;
    const conflict = await model
      .findOne({ slug: candidate, _id: { $ne: selfId } })
      .select("_id");
    if (!conflict) return candidate;
    attempt += 1;
  }
};

const applicationSchema = new Schema<IApplication>(
  {
    slug: { type: String, unique: true, sparse: true, index: true },
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    resume: { type: String },
    resumeUrl: { type: String },
    cloudinaryPublicId: { type: String },
    experience: String,
    education: String,
    skills: [String],
    coverLetter: String,
    isReferred: { type: Boolean, default: false },
    referrerName: { type: String },
    referrerEmail: { type: String },
    referralMessage: { type: String },
    recommendationId: { type: Schema.Types.ObjectId, ref: "Recommendation" },
    questionAnswers: [
      {
        questionId: { type: Schema.Types.ObjectId },
        questionText: { type: String },
        questionType: {
          type: String,
          enum: ["text", "multipleChoice", "checkbox", "file", "rating"],
        },
        answer: { type: Schema.Types.Mixed },
        fileUrl: { type: String },
        cloudinaryPublicId: { type: String },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "reviewing", "shortlisted", "rejected", "offered", "hired"],
      default: "pending",
      index: true,
    },
    hrNotes: { type: String },
    offerLetter: { type: String },
    offerLetterId: { type: Schema.Types.ObjectId, ref: "OfferLetter" },
  },
  { timestamps: true }
);

applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ jobId: 1, status: 1 });

applicationSchema.pre("validate", async function () {
  if (!this.slug || this.isModified("fullName")) {
    const base = slugBase(this.fullName);
    const ApplicationModel = mongoose.models.Application || mongoose.model<IApplication>("Application", applicationSchema);
    this.slug = await ensureUniqueSlug(ApplicationModel, base, this._id);
  }
});

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", applicationSchema);

export default Application;
export { Application };
