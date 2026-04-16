const Resume = require("../models/Resume");
const pdfService = require("../services/pdfService");
const aiService = require("../services/aiServices");
const axios = require("axios");
const matchingService = require("../services/matchingService");
const pdfreportService = require("../services/pdfreportService");
const { analysisQueue } = require("../config/queue");
function extractJSON(text) {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (err) {
    console.log("JSON parse failed 👉", err);
    return null;
  }
}

exports.analyzeResume = async (req, res) => {
  try {
    // 🔴 1. Validate file
    if (!req.file) {
      return res.status(400).json({
        message: "Resume file is required"
      });
    }

    const jobDescription = req.body.jobDescription;

    if (!jobDescription) {
      return res.status(400).json({
        message: "Job description is required"
      });
    }

    const filePath = req.file.path;

    // 🔵 2. Extract resume text
    const text = await pdfService.extractText(filePath);

    if (!text || text.length < 50) {
      return res.status(400).json({
        message: "Invalid or empty resume"
      });
    }

    // 🔵 3. Save to MongoDB with 'Processing' status
    const reportData = {
      fileName: req.file.filename,
      filePath,
      text,
      status: 'Processing',
      createdAt: new Date()
    };

    if (req.user) {
      reportData.userId = req.user.userId;
    }

    const savedResume = await Resume.create(reportData);

    // 🔵 4. Add job to Queue
    await analysisQueue.add("analyze-resume", {
      reportId: savedResume._id,
      resumeText: text,
      jobDescription: jobDescription
    });

    // 🔵 5. Return reportId immediately
    res.json({
      message: "Analysis started",
      reportId: savedResume._id
    });

  } catch (error) {
    console.log("ERROR 👉", error.message || error);
    res.status(500).json({
      message: "Failed to start analysis",
      error: error.message
    });
  }
};

exports.getReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Resume.findById(id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch status",
      error: error.message
    });
  }
};
exports.generatePDFReport = async (req, res) => {
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({
        message: 'Report payload is required in request body',
      });
    }
    const { atsScore, matchedSkills, missingSkills, suggestions } = data;
    const pdfBuffer = await pdfreportService.generatePDFReport({ atsScore, matchedSkills, missingSkills, suggestions });
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=ats_report.pdf"
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.log("ERROR 👉", error.response?.data || error.message || error);
    res.status(500).json({
      message: "Failed to generate PDF report",
      error: error.message
    });
  }
};
// 🔒 Get Reports
exports.getReports = async (req, res) => {
  try {
    const reports = await Resume.find({
      userId: req.user.userId
    });
    res.json(reports);
  } catch (error) {
    console.log("ERROR 👉", error.response?.data || error.message || error);
    res.status(500).json({
      message: "Failed to retrieve reports",
      error: error.message
    });
  }
};

// 🔒 Delete Report
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Resume.findOneAndDelete({
      _id: id,
      userId: req.user.userId
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found or unauthorized" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    console.log("ERROR 👉", error.response?.data || error.message || error);
    res.status(500).json({
      message: "Failed to delete report",
      error: error.message
    });
  }
};