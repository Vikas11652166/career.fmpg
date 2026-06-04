import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecommendation extends Document {
  recommender: mongoose.Types.ObjectId;
  recommenderId: string;
  recommendedUser: mongoose.Types.ObjectId;
  recommendedUserEmail: string;
  recommendedUserName: string;
  jobId: mongoose.Types.ObjectId;
  status: "pending" | "reviewed" | "selected" | "rejected";
  recommendationMessage?: string;
  adminNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  applicationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRecommendationModel extends Model<IRecommendation> {
  getActivePendingCount(recommenderId: any): Promise<number>;
}

const recommendationSchema = new Schema<IRecommendation>({
  recommender: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  recommenderId: { 
    type: String, 
    required: true 
  },
  recommendedUser: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  recommendedUserEmail: { 
    type: String, 
    required: true 
  },
  recommendedUserName: { 
    type: String, 
    required: true 
  },
  jobId: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  status: { 
    type: String, 
    enum: ["pending", "reviewed", "selected", "rejected"], 
    default: "pending" 
  },
  recommendationMessage: { 
    type: String, 
    maxlength: 500 
  },
  adminNotes: { 
    type: String, 
    maxlength: 500 
  },
  reviewedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  },
  reviewedAt: { 
    type: Date 
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: "Application"
  }
}, {
  timestamps: true
});

recommendationSchema.index({ recommender: 1, status: 1 });
recommendationSchema.index({ recommendedUser: 1 });
recommendationSchema.index({ jobId: 1, status: 1 });
recommendationSchema.index({ status: 1, createdAt: -1 });

recommendationSchema.statics.getActivePendingCount = function(
  recommenderId: any
) {
  return this.countDocuments({ 
    recommender: recommenderId, 
    status: 'pending' 
  });
};

const Recommendation: IRecommendationModel = 
  (mongoose.models.Recommendation as IRecommendationModel) || 
  mongoose.model<IRecommendation, IRecommendationModel>("Recommendation", recommendationSchema);

export default Recommendation;
export { Recommendation };
