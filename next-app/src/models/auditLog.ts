import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  actor: mongoose.Types.ObjectId;
  actorRole: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "ASSIGN" | "REVOKE" | "UPDATE_PERMISSIONS" | "ISSUE" | "EMAIL" | "ACCEPT" | "REJECT" | "STATUS_CHANGE" | "VERIFY" | "DOWNLOAD";
  resourceEntity: string;
  resourceId?: mongoose.Types.ObjectId;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
  actorRole: { type: String, required: true },
  action: { 
    type: String, 
    enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "ASSIGN", "REVOKE", "UPDATE_PERMISSIONS", "ISSUE", "EMAIL", "ACCEPT", "REJECT", "STATUS_CHANGE", "VERIFY", "DOWNLOAD"], 
    required: true 
  },
  resourceEntity: { type: String, required: true },
  resourceId: { type: Schema.Types.ObjectId, refPath: 'resourceEntity' },
  changes: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

export default AuditLog;
export { AuditLog };
