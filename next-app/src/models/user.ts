import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPermissions {
  canGenerateCertificate: boolean;
  canGenerateOfferLetter: boolean;
  canCreateJob: boolean;
  canViewApplicants: boolean;
  canManageReviews: boolean;
  canManageEmployees: boolean;
  canManageRecommendations: boolean;
  canAccessDashboard: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  role: "user" | "admin" | "employee" | "super-admin";
  permissions: IPermissions;
  assignedJobs: mongoose.Types.ObjectId[];
  status: "active" | "inactive" | "former" | "suspended";
  positionLevel: string;
  isEmailVerified: boolean;
  emailVerificationOTP?: string | null;
  emailVerificationOTPExpiry?: Date | null;
  passwordResetOTP?: string | null;
  passwordResetOTPExpiry?: Date | null;
  moreInfo?: mongoose.Types.ObjectId;
  offerLetter?: mongoose.Types.ObjectId;
  department?: string;
  position?: string;
  reportingManager?: string;
  employeeId?: string;
  terminatedAt?: Date | null;
  terminationReason?: string | null;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    default: "user", 
    enum: ["user", "admin", "employee", "super-admin"] 
  },
  permissions: {
    canGenerateCertificate: { type: Boolean, default: false },
    canGenerateOfferLetter: { type: Boolean, default: false },
    canCreateJob: { type: Boolean, default: false },
    canViewApplicants: { type: Boolean, default: false },
    canManageReviews: { type: Boolean, default: false },
    canManageEmployees: { type: Boolean, default: false },
    canManageRecommendations: { type: Boolean, default: false },
    canAccessDashboard: { type: Boolean, default: false }
  },
  assignedJobs: [{ type: Schema.Types.ObjectId, ref: "Job" }],
  status: { 
    type: String, 
    enum: ["active", "inactive", "former", "suspended"], 
    default: "active" 
  },
  positionLevel: {
    type: String,
    enum: [
      "Junior", "Mid", "Senior", "Lead", "Manager", "Director", "VP", "C-Level",
      "junior", "mid", "senior", "lead", "manager", "director", "vp", "c-level"
    ],
    default: "Junior"
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    default: null
  },
  emailVerificationOTPExpiry: {
    type: Date,
    default: null
  },
  passwordResetOTP: {
    type: String,
    default: null
  },
  passwordResetOTPExpiry: {
    type: Date,
    default: null
  },
  moreInfo: { type: Schema.Types.ObjectId, ref: "UserMoreInfo" }, 
  offerLetter: { type: Schema.Types.ObjectId, ref: "OfferLetter" }, 
  department: { type: String },
  position: { type: String },
  reportingManager: { type: String },
  employeeId: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  terminatedAt: {
    type: Date,
    default: null
  },
  terminationReason: {
    type: String,
    default: null
  },
  createdAt: { type: Date, default: Date.now }
});

// Avoid OverwriteModelError in hot-reloading Dev environment
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
