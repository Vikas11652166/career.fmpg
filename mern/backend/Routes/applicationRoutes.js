const express = require("express");
const router = express.Router();
const applicationController = require("../Controllers/applicationController");
const { verifyAdmin, auth, isHR, hasPermission, checkJobAssignment } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer for resume uploads (memory storage for Cloudinary)
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  }
});

// More flexible file filter for question answers (allows more file types)
const questionFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png|gif|mp3|mp4|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error("Unsupported file type for question answer"));
    }
  }
});

// Public route to submit application
router.post("/submit", resumeUpload.single("resume"), applicationController.submitApplication);

// User routes
router.post("/", auth, resumeUpload.single("resume"), applicationController.createApplication);
router.post("/parse-resume", auth, resumeUpload.single("resume"), applicationController.parseResume);
router.get("/my", auth, applicationController.getMyApplications);
router.get("/my/:applicationId/offer-letter", auth, applicationController.getMyApplicationOfferLetter);
router.get("/for-recommendation", auth, applicationController.getApplicationsForRecommendation);
router.get("/check-status/:jobId", auth, applicationController.checkApplicationStatus);
router.get("/check-statuses", auth, applicationController.checkMultipleApplicationStatuses);
router.get("/:id/resume-access", auth, applicationController.getResumeAccessUrl);

// New routes for question handling
router.post("/upload-question-file", auth, questionFileUpload.single("file"), applicationController.uploadQuestionFile);
router.put("/:applicationId/answers", auth, applicationController.updateApplicationAnswers);

// Admin/HR routes
router.get("/dashboard/stats", auth, isHR, applicationController.getDashboardStats);
router.get("/", auth, hasPermission('canViewApplicants'), applicationController.getAllApplications); // Global list still requires permission
router.get("/job/:jobId", auth, isHR, checkJobAssignment, applicationController.getJobApplications);
router.get("/:id/detail", auth, isHR, applicationController.getApplicationDetail); // Controller/middleware will check assignment
router.put("/:id/status", auth, isHR, applicationController.updateApplicationStatus); // Controller/middleware will check assignment
router.post("/:applicationId/offer", auth, hasPermission('canGenerateOfferLetter'), applicationController.generateOfferLetter);
router.get("/:applicationId/offer-letter", auth, isHR, applicationController.getApplicationOfferLetter);
router.post("/:applicationId/reject", auth, isHR, applicationController.rejectApplication);
router.post("/:applicationId/welcome", auth, isHR, applicationController.sendWelcomeEmail);



module.exports = router;