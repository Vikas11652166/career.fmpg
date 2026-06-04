const AuditLog = require("../models/auditLog");

/**
 * Log an audit trail entry.
 * @param {Object} params
 * @param {Object} params.req - Express Request Object (to get user, ip, userAgent)
 * @param {String} params.action - Action performed (CREATE, UPDATE, DELETE, etc.)
 * @param {String} params.resourceEntity - Entity type (Job, User, Application, etc.)
 * @param {mongoose.Types.ObjectId|String} params.resourceId - ID of the entity affected
 * @param {Object} [params.changes] - Details of the changes made {old: ..., new: ...}
 */
exports.logAudit = async ({ req, action, resourceEntity, resourceId, changes = null }) => {
  try {
    if (!req.user) {
      console.warn("Audit Logging: Expected req.user but got undefined. Skipping audit log.");
      return;
    }

    const log = new AuditLog({
      actor: req.user._id,
      actorRole: req.user.role,
      action,
      resourceEntity,
      resourceId,
      changes,
      ipAddress: req.ip || (req.connection && req.connection.remoteAddress) || null,
      userAgent: req.get ? req.get("User-Agent") : null
    });

    await log.save();
  } catch (error) {
    console.error("Failed to save audit log:", error);
  }
};
