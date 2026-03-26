const express = require("express");
const router = express.Router();

const resumeController = require("../controllers/resumeController");
const upload = require("../middlewares/uploadMiddleware");

router.get("/", resumeController.getResumes);
router.post(
  "/analyze",
  upload.single("resume"),
  resumeController.analyzeResume
);

module.exports = router;