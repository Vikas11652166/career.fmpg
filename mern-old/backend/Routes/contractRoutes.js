const express = require("express");
const router = express.Router();
const contractController = require("../Controllers/contractController");
const { auth, isHR } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer for document uploads
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed"));
    }
  }
});

// Public routes for offer acceptance (no auth required)
router.get("/offer/accept/:slug", contractController.getOfferForAcceptance);
router.post("/offer/accept/:slug", contractController.acceptOffer);
router.post("/offer/reject/:slug", contractController.rejectOffer);

// Document upload route (can be used during acceptance process)
router.post("/:contractId/upload", documentUpload.single("document"), contractController.uploadContractDocument);

// Admin routes for contract management
router.get("/", auth, isHR, contractController.getAllContracts);
router.get("/application/:applicationId", auth, isHR, contractController.getContractByApplicationId);
router.get("/:contractId", auth, isHR, contractController.getContractById);
router.put("/:contractId/status", auth, isHR, contractController.updateContractStatus);
router.get("/:contractId/pdf", auth, isHR, contractController.generateContractPDF);

module.exports = router;
