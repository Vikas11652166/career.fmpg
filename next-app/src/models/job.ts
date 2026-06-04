import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJobQuestion {
  questionText: string;
  questionType: "text" | "multipleChoice" | "checkbox" | "file" | "rating";
  required: boolean;
  options?: string[];
  maxRating?: number;
  order: number;
}

export interface IJob extends Document {
  slug?: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  location?: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship";
  salary?: string;
  department?: string;
  position?: string;
  reportingManager?: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  postedBy?: mongoose.Types.ObjectId;
  isActive: boolean;
  hrContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  questions: IJobQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const slugBase = (value: string): string => {
  return (value || 'job')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'job';
};

const alphaSuffix = (index: number): string => {
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

const ensureUniqueSlug = async (model: Model<IJob>, base: string, selfId: any): Promise<string> => {
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

const jobSchema = new Schema<IJob>({
  slug: { type: String, unique: true, sparse: true, index: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [String],
  responsibilities: [String],
  location: String,
  type: { type: String, enum: ["Full-time", "Part-time", "Contract", "Internship"] },
  salary: { type: String },
  department: { type: String },
  position: { type: String },
  reportingManager: String,
  imageUrl: String,
  cloudinaryPublicId: String,
  postedBy: { type: Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true, index: true },
  hrContact: {
    name: String,
    email: String,
    phone: String,
  },
  questions: [{
    questionText: { type: String, required: true },
    questionType: { 
      type: String, 
      enum: ["text", "multipleChoice", "checkbox", "file", "rating"],
      required: true 
    },
    required: { type: Boolean, default: false },
    options: [String],
    maxRating: { type: Number, default: 5 },
    order: { type: Number, default: 0 }
  }],
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

// Indices
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ location: 'text', title: 'text', description: 'text' });
jobSchema.index({ department: 1 });
jobSchema.index({ type: 1 });

// Slug creation pre-validate hook
jobSchema.pre('validate', async function () {
  if (!this.slug || this.isModified('title') || this.isModified('position')) {
    const base = slugBase(this.title || this.position || 'job');
    const JobModel = mongoose.models.Job || mongoose.model<IJob>("Job", jobSchema);
    this.slug = await ensureUniqueSlug(JobModel, base, this._id);
  }
});

const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>("Job", jobSchema);

export default Job;
export { Job };
