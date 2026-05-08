const express = require("express");
const router = express.Router();
const AuditLog = require("../models/auditLog");
const { auth } = require("../middleware/authMiddleware");

// Middleware to authorize only super-admin
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "super-admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Super Admin only." });
  }
};

router.get("/logs", auth, isSuperAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.entity) {
      query.resourceEntity = req.query.entity;
    }
    if (req.query.action) {
      query.action = req.query.action;
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate("actor", "name email role")
      .populate({
        path: "resourceId",
        select: "name email title company" // Removed the match block
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    res.status(200).json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Audit Logs Error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs", details: error.message });
  }
});

module.exports = router;
