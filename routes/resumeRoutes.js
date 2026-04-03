const express = require("express");
const router = express.Router();

const resumeController = require("../controllers/resumeController");
const { upload, authMiddleware } = require("../middlewares/uploadMiddleware");

// Optional auth middleware for analyze - saves userId if logged in
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header) {
    const token = header.split(" ")[1];
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Token invalid, just continue without auth
    }
  }
  next();
};

router.post(
  "/analyze",
  optionalAuth,
  upload.single("resume"),
  resumeController.analyzeResume
);
router.post("/download-report",resumeController.generatePDFReport);
router.get("/reports",authMiddleware,resumeController.getReports);
module.exports = router;