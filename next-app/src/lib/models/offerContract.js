import mongoose from "mongoose";

const contractSchema = new mongoose.Schema({
  offerLetterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "OfferLetter", 
    required: true 
  },
  applicationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Application", 
    required: true 
  },
  candidateName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  personalInfo: {
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' }
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String }
    },
    identificationDocuments: {
      idType: { 
        type: String, 
        enum: ['Aadhar', 'PAN', 'Passport', 'Driving License', 'Voter ID'], 
        required: true 
      },
      idNumber: { type: String, required: true },
      documentUrl: { type: String },
      cloudinaryPublicId: { type: String }
    }
  },
  bankingInfo: {
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    ifscCode: { type: String, required: true },
    accountType: { 
      type: String, 
      enum: ['Savings', 'Current'], 
      required: true 
    },
    branch: { type: String, required: true }
  },
  employmentDetails: {
    position: { type: String, required: true },
    department: { type: String, required: true },
    salary: { type: String, required: true },
    startDate: { type: Date, required: true },
    joiningLocation: { type: String, required: true },
    workType: { 
      type: String, 
      enum: ['Remote', 'On-site', 'Hybrid'], 
      required: true 
    },
    reportingManager: { type: String }
  },
  status: {
    type: String,
    enum: ['Draft', 'Under_Review', 'Approved', 'Rejected', 'Requires_Clarification'],
    default: 'Under_Review'
  },
  acceptedAt: { type: Date, default: Date.now },
  agreementTerms: {
    termsAccepted: { type: Boolean, required: true, default: false },
    privacyPolicyAccepted: { type: Boolean, required: true, default: false },
    acceptedAt: { type: Date },
    ipAddress: { type: String }
  }
}, {
  timestamps: true
});

const EmploymentContract = mongoose.models.EmploymentContract || mongoose.model("EmploymentContract", contractSchema);
export default EmploymentContract;
