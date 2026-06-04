const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actorRole: { type: String, required: true },
  action: { type: String, enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "ASSIGN", "REVOKE", "UPDATE_PERMISSIONS", "ISSUE", "EMAIL", "ACCEPT", "REJECT", "STATUS_CHANGE", "VERIFY", "DOWNLOAD"], required: true },
  resourceEntity: { type: String, required: true }, // 'User', 'Job', 'Application', 'OfferLetter', 'Certificate', etc.
  resourceId: { type: mongoose.Schema.Types.ObjectId, refPath: 'resourceEntity' },
  changes: { type: mongoose.Schema.Types.Mixed }, // old/new delta
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
