import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExtensionHistory {
  oldValidUntil?: Date;
  newValidUntil?: Date;
  oldStartDate?: Date;
  newStartDate?: Date;
  notes?: string;
  previousOfferSnapshot?: any;
  updatedOfferSnapshot?: any;
  extendedAt: Date;
  extendedBy?: mongoose.Types.ObjectId;
}

export interface IOfferLetter extends Document {
  userId?: mongoose.Types.ObjectId;
  applicationId?: mongoose.Types.ObjectId;
  candidateName: string;
  email: string;
  position: string;
  department: string;
  salary: string;
  offerType: 'Job' | 'Internship';
  payoutFrequency?: string;
  startDate: Date;
  endDate?: Date;
  duration?: string;
  joiningLocation?: string;
  workType: 'Remote' | 'On-site' | 'Hybrid';
  benefits: string[];
  reportingManager?: string;
  companyName: string;
  hrContactName?: string;
  hrContactEmail?: string;
  hrContactPhone?: string;
  issuedBy: string;
  issuedOn: Date;
  status: 'Pending' | 'Accepted' | 'Rejected';
  validUntil: Date;
  shortId?: string;
  additionalNotes?: string;
  extensionHistory: IExtensionHistory[];
  acceptedAt?: Date;
  rejectedAt?: Date;
  acceptanceToken?: string;
  acceptanceComments?: string;
  contractId?: mongoose.Types.ObjectId;
  pdfBuffer?: Buffer;
  pdfGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const offerLetterSchema = new Schema<IOfferLetter>({
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
  candidateName: { type: String, required: true },
  email: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String, required: true },
  salary: { type: String, required: true },
  offerType: { type: String, enum: ['Job', 'Internship'], default: 'Job' },
  payoutFrequency: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  duration: { type: String },
  joiningLocation: { type: String },
  workType: { type: String, enum: ['Remote', 'On-site', 'Hybrid'], default: 'On-site' },
  benefits: [{ type: String }],
  reportingManager: { type: String },
  companyName: { type: String, default: "FMPG" },
  hrContactName: { type: String },
  hrContactEmail: { type: String },
  hrContactPhone: { type: String },
  issuedBy: { type: String, default: "FMPG" },
  issuedOn: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  validUntil: { type: Date, required: true },
  shortId: { type: String, unique: true, sparse: true },
  additionalNotes: { type: String },
  extensionHistory: [{
    oldValidUntil: Date,
    newValidUntil: Date,
    oldStartDate: Date,
    newStartDate: Date,
    notes: String,
    previousOfferSnapshot: Schema.Types.Mixed,
    updatedOfferSnapshot: Schema.Types.Mixed,
    extendedAt: { type: Date, default: Date.now },
    extendedBy: { type: Schema.Types.ObjectId, ref: "User" }
  }],
  acceptedAt: Date,
  rejectedAt: Date,
  acceptanceToken: { type: String, unique: true, sparse: true },
  acceptanceComments: { type: String },
  contractId: { type: Schema.Types.ObjectId, ref: "EmploymentContract" },
  pdfBuffer: { type: Buffer },
  pdfGeneratedAt: Date
}, {
  timestamps: true
});

const OfferLetter: Model<IOfferLetter> = mongoose.models.OfferLetter || mongoose.model<IOfferLetter>("OfferLetter", offerLetterSchema);

export default OfferLetter;
export { OfferLetter };
