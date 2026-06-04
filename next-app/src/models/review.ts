import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  rating: number;
  title: string;
  content: string;
  department?: string;
  position?: string;
  workType?: 'Remote' | 'On-site' | 'Hybrid';
  employmentDuration?: string;
  pros?: string;
  cons?: string;
  advice?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerType: 'employee' | 'offer_recipient';
  isAnonymous: boolean;
  moderatorNotes?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  department: { 
    type: String, 
    required: false 
  },
  position: { 
    type: String, 
    required: false 
  },
  workType: { 
    type: String, 
    enum: ['Remote', 'On-site', 'Hybrid'], 
    required: false 
  },
  employmentDuration: { 
    type: String, 
    required: false 
  },
  pros: { 
    type: String, 
    maxlength: 500 
  },
  cons: { 
    type: String, 
    maxlength: 500 
  },
  advice: { 
    type: String, 
    maxlength: 500 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  reviewerType: {
    type: String,
    enum: ['employee', 'offer_recipient'],
    required: true
  },
  isAnonymous: { 
    type: Boolean, 
    default: false 
  },
  moderatorNotes: { 
    type: String 
  },
  approvedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  },
  approvedAt: { 
    type: Date 
  },
  rejectedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  },
  rejectedAt: { 
    type: Date 
  },
  rejectionReason: { 
    type: String 
  }
}, {
  timestamps: true
});

reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });

const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);

export default Review;
export { Review };
