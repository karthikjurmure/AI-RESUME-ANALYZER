const Resume = require("../models/Resume");
const pdfService = require("../services/pdfService");
const aiService = require("../services/aiServices");
const axios = require("axios");
const matchingService = require("../services/matchingService");
const pdfreportService = require("../services/pdfreportService");
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

    // 🔵 3. AI Resume Analysis
    const aiResume = await aiService.analyzeResume(text);
    const resumeData = extractJSON(aiResume);
    const resumeSkills = resumeData ? resumeData.skills : [];

    if (!resumeSkills || resumeSkills.length === 0) {
      return res.status(400).json({
        message: "Failed to extract resume data"
      });
    }

    // 🔵 4. AI Job Skills
    const aiJob = await aiService.extractJobSkills(jobDescription);
    const jobData = extractJSON(aiJob);
    const jobSkills = jobData ? jobData.skills : [];

    if (!jobSkills || jobSkills.length === 0) {
      return res.status(400).json({
        message: "Failed to extract job data"
      });
    }

    // 🔵 5. Skill Matching
    const result = await matchingService.matchSkills(
      resumeSkills,
      jobSkills
    );

    // 🔵 6. AI Suggestions
    const aiSuggestions = await aiService.getSuggestions(
      result.missingSkills,
      jobDescription
    );

    console.log("AI Suggestions 👉", aiSuggestions);

    const suggestionData = extractJSON(aiSuggestions);

    const suggestions = suggestionData?.suggestions || [];

    // 🔵 6a. Link Auditor
    const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s,)]+)/gi;
    const extractedUrls = text.match(urlRegex) || [];
    const uniqueUrls = [...new Set(extractedUrls)].filter(url => {
      const lower = url.toLowerCase();
      if (lower.startsWith('mailto:')) return false;
      if (lower.includes('@') && !lower.startsWith('http')) return false;
      if (lower.includes('node.js') || lower.includes('vue.js') || lower.includes('next.js') || lower.includes('nuxt.js') || lower.includes('react.js')) return false;
      return true;
    });

    if (uniqueUrls.length > 0) {
      try {
        const linkAuditResult = await aiService.auditLinks(uniqueUrls);
        if (linkAuditResult) {
          // Parse JSON array returned by AI and spread each suggestion into the list
          const arrMatch = linkAuditResult.match(/\[[\s\S]*\]/);
          if (arrMatch) {
            const linkSuggestions = JSON.parse(arrMatch[0]);
            if (Array.isArray(linkSuggestions)) {
              linkSuggestions.forEach(s => {
                if (typeof s === 'string' && s.trim()) suggestions.push(s.trim());
              });
            }
          }
        }
      } catch (err) {
        console.log("Link Audit failed 👉", err.message);
      }
    }

    // 🔵 7. Final Response
    // 🔒 Save suggestions only if logged in
    const reportData = {
      fileName: req.file.filename,
      filePath,
      text,
      atsScore: result?.atsScore ?? 0,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      createdAt: new Date()
    };

    if (req.user) {
      // 🔒 Save reports WITH userId
      reportData.userId = req.user.userId;
      reportData.suggestions = suggestions;
    }

    const savedResume = await Resume.create(reportData);

    res.json({
      atsScore: result?.atsScore ?? 0,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      suggestions
    });

  } catch (error) {

    console.log("ERROR 👉", error.response?.data || error.message || error);

    res.status(500).json({
      message: "Analysis failed",
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