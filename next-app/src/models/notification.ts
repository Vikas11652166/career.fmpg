import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJobUpdateDetails {
  jobTitle?: string;
  oldRequirements?: string[];
  newRequirements?: string[];
  oldResponsibilities?: string[];
  newResponsibilities?: string[];
  changedFields?: string[];
  updateType?: "requirements" | "responsibilities" | "both" | "other";
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "job_update" | "application_status" | "system";
  title: string;
  message: string;
  relatedJobId?: mongoose.Types.ObjectId;
  relatedApplicationId?: mongoose.Types.ObjectId;
  isRead: boolean;
  readAt?: Date;
  jobUpdateDetails?: IJobUpdateDetails;
  priority: "low" | "medium" | "high";
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  markAsRead(): Promise<this>;
}

export interface INotificationModel extends Model<INotification> {
  createJobUpdateNotification(
    userId: mongoose.Types.ObjectId,
    jobId: mongoose.Types.ObjectId,
    applicationId: mongoose.Types.ObjectId,
    updateDetails: IJobUpdateDetails
  ): Promise<INotification>;
}

const notificationSchema = new Schema<INotification>({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  type: { 
    type: String, 
    enum: ["job_update", "application_status", "system"], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  relatedJobId: { 
    type: Schema.Types.ObjectId, 
    ref: "Job" 
  },
  relatedApplicationId: { 
    type: Schema.Types.ObjectId, 
    ref: "Application" 
  },
  isRead: { 
    type: Boolean, 
    default: false,
    index: true
  },
  readAt: { 
    type: Date 
  },
  jobUpdateDetails: {
    oldRequirements: [String],
    newRequirements: [String],
    oldResponsibilities: [String],
    newResponsibilities: [String],
    changedFields: [String],
    updateType: { 
      type: String, 
      enum: ["requirements", "responsibilities", "both", "other"],
      default: "other"
    }
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high"], 
    default: "medium" 
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ relatedJobId: 1 });

// Instance Method: Mark read
notificationSchema.methods.markAsRead = function(this: INotification) {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static Method: Create Job Update Alert
notificationSchema.statics.createJobUpdateNotification = function(
  userId: mongoose.Types.ObjectId,
  jobId: mongoose.Types.ObjectId,
  applicationId: mongoose.Types.ObjectId,
  updateDetails: IJobUpdateDetails
) {
  const title = "Job Requirements Updated";
  const jobTitle = updateDetails.jobTitle || "Job";
  
  let message = `The job "${jobTitle}" you applied for has been updated. `;
  
  if (updateDetails.updateType === "requirements") {
    message += "The job requirements have been modified. Please review the updated requirements and consider updating your application or skills accordingly.";
  } else if (updateDetails.updateType === "responsibilities") {
    message += "The job responsibilities have been modified. Please review the updated responsibilities to better understand the role.";
  } else if (updateDetails.updateType === "both") {
    message += "Both job requirements and responsibilities have been modified. Please review the updates and consider updating your application or skills accordingly.";
  } else {
    message += "Important details about this job have been updated. Please review the changes.";
  }

  return this.create({
    userId,
    type: "job_update",
    title,
    message,
    relatedJobId: jobId,
    relatedApplicationId: applicationId,
    jobUpdateDetails: updateDetails,
    priority: updateDetails.updateType === "requirements" ? "high" : "medium"
  });
};

const Notification: INotificationModel = 
  (mongoose.models.Notification as INotificationModel) || 
  mongoose.model<INotification, INotificationModel>("Notification", notificationSchema);

export default Notification;
export { Notification };
