const express = require("express");
const router = express.Router();

const resumeController = require("../controllers/resumeController");
const upload = require("../middlewares/uploadMiddleware"); // make sure this exists

// Upload resume (optional old API)
router.post("/upload", upload.single("resume"), resumeController.uploadResume);

// Get all resumes
router.get("/", resumeController.getResumes);

// Match resume (old API)
router.post("/match", resumeController.matchResumeWithJob);

// 🔥 NEW MAIN API
router.post(
  "/analyze",
  upload.single("resume"),
  resumeController.analyzeResume
);

module.exports = router;