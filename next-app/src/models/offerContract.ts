import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmploymentContract extends Document {
  offerLetterId: mongoose.Types.ObjectId;
  applicationId: mongoose.Types.ObjectId;
  candidateName: string;
  email: string;
  phone: string;
  personalInfo: {
    dateOfBirth: Date;
    nationality: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
    identificationDocuments: {
      idType: 'Aadhar' | 'PAN' | 'Passport' | 'Driving License' | 'Voter ID';
      idNumber: string;
      documentUrl?: string;
      cloudinaryPublicId?: string;
    };
  };
  bankingInfo: {
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    accountType: 'Savings' | 'Current';
    branch: string;
  };
  employmentDetails: {
    position: string;
    department: string;
    salary: string;
    startDate: Date;
    joiningLocation: string;
    workType: 'Remote' | 'On-site' | 'Hybrid';
    reportingManager?: string;
  };
  status: 'Draft' | 'Under_Review' | 'Approved' | 'Rejected' | 'Requires_Clarification';
  workflowStatus: {
    currentStage: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_changes';
    submittedAt?: Date;
    reviewedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    stages: {
      submitted?: {
        completedAt?: Date;
        completedBy?: string;
      };
      under_review?: {
        completedAt?: Date;
        completedBy?: mongoose.Types.ObjectId;
      };
      approved?: {
        completedAt?: Date;
        completedBy?: mongoose.Types.ObjectId;
      };
      rejected?: {
        completedAt?: Date;
        completedBy?: mongoose.Types.ObjectId;
        reason?: string;
      };
    };
  };
  acceptedAt?: Date;
  acceptanceComments?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  adminComments?: string;
  documents: Array<{
    documentType: 'ID_Proof' | 'Address_Proof' | 'Educational_Certificate' | 'Experience_Letter' | 'Other';
    fileName: string;
    fileUrl: string;
    cloudinaryPublicId?: string;
    uploadedAt: Date;
  }>;
  agreementTerms: {
    termsAccepted: boolean;
    privacyPolicyAccepted: boolean;
    acceptedAt?: Date;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const contractSchema = new Schema<IEmploymentContract>({
  offerLetterId: { type: Schema.Types.ObjectId, ref: "OfferLetter", required: true },
  applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true },
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
  workflowStatus: {
    currentStage: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'requires_changes'],
      default: 'submitted'
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    stages: {
      submitted: {
        completedAt: Date,
        completedBy: String
      },
      under_review: {
        completedAt: Date,
        completedBy: { type: Schema.Types.ObjectId, ref: "User" }
      },
      approved: {
        completedAt: Date,
        completedBy: { type: Schema.Types.ObjectId, ref: "User" }
      },
      rejected: {
        completedAt: Date,
        completedBy: { type: Schema.Types.ObjectId, ref: "User" },
        reason: String
      }
    }
  },
  acceptedAt: { type: Date, default: Date.now },
  acceptanceComments: { type: String },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  adminComments: { type: String },
  documents: [{
    documentType: { 
      type: String, 
      enum: ['ID_Proof', 'Address_Proof', 'Educational_Certificate', 'Experience_Letter', 'Other'],
      required: true 
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  agreementTerms: {
    termsAccepted: { type: Boolean, required: true, default: false },
    privacyPolicyAccepted: { type: Boolean, required: true, default: false },
    acceptedAt: { type: Date },
    ipAddress: { type: String }
  }
}, {
  timestamps: true
});

contractSchema.index({ offerLetterId: 1 }, { unique: true });
contractSchema.index({ email: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ createdAt: -1 });

const EmploymentContract: Model<IEmploymentContract> = 
  mongoose.models.EmploymentContract || 
  mongoose.model<IEmploymentContract>("EmploymentContract", contractSchema);

export default EmploymentContract;
export { EmploymentContract };
