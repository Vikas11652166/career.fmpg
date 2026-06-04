const mongoose = require("mongoose");

const offerLetterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" }, // Link to application
  candidateName: { type: String, required: true },
  email: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String, required: true },
  salary: { type: String, required: true },
  offerType: { type: String, enum: ['Job', 'Internship'], default: 'Job' },
  payoutFrequency: { type: String }, // For internships: Monthly, Quarterly, Lumpsum, On Completion, etc.
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
  shortId: { type: String, unique: true, sparse: true }, // For efficient lookups by partial ID
  additionalNotes: { type: String },
  extensionHistory: [{
    oldValidUntil: { type: Date },
    newValidUntil: { type: Date },
    oldStartDate: { type: Date },
    newStartDate: { type: Date },
    notes: { type: String },
    previousOfferSnapshot: { type: mongoose.Schema.Types.Mixed },
    updatedOfferSnapshot: { type: mongoose.Schema.Types.Mixed },
    extendedAt: { type: Date, default: Date.now },
    extendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }],
  
  // Acceptance workflow fields
  acceptedAt: { type: Date },
  rejectedAt: { type: Date },
  acceptanceToken: { type: String, unique: true, sparse: true }, // For secure acceptance link
  acceptanceComments: { type: String }, // Candidate's acceptance/rejection comments
  
  // Link to signed contract when accepted
  contractId: { type: mongoose.Schema.Types.ObjectId, ref: "Contract" },
  
  // PDF Caching
  pdfBuffer: { type: Buffer },
  pdfGeneratedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model("OfferLetter", offerLetterSchema);