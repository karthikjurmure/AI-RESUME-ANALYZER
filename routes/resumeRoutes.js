const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const resumeController = require("../controllers/resumeController");
router.get("/", resumeController.getResumes);
router.post("/upload",
upload.single("resume"),
resumeController.uploadResume);

module.exports = router;