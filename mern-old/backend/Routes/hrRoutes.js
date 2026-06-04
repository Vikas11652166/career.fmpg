const express = require("express");
const router = express.Router();
const hrController = require("../Controllers/hrController");
const { authenticateToken, verifySuperAdmin } = require("../middleware/authMiddleware");

// All HR management routes require Special Authority (Super-Admin)
router.use(authenticateToken);
router.use(verifySuperAdmin);

router.get("/", hrController.getAllHRs);
router.post("/", hrController.createHR);
router.put("/:hrId/permissions", hrController.updateHRPermissions);
router.get("/audit-logs", hrController.getAuditLogs);
router.get("/jobs", hrController.getAvailableJobs);
router.delete("/:hrId", hrController.revokeHR);

module.exports = router;
