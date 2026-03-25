const Resume = require("../models/Resume");
const pdfService = require("../services/pdfService");
const aiService = require("../services/aiServices");
const axios = require("axios");
const matchingService = require("../services/matchingService");
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
exports.getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find();
    res.json(resumes);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching resumes"
    });
  }
};

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
    console.log("AI Resume 👉", aiResume);

    const resumeData = extractJSON(aiResume);

    if (!resumeData || !resumeData.skills) {
      return res.status(400).json({
        message: "Failed to extract resume data"
      });
    }

    const resumeSkills = resumeData.skills;

    // 🔵 4. AI Job Skills
    const aiJob = await aiService.extractJobSkills(jobDescription);
    console.log("AI Job 👉", aiJob);

    const jobData = extractJSON(aiJob);

    if (!jobData || !jobData.skills) {
      return res.status(400).json({
        message: "Failed to extract job data"
      });
    }

    const jobSkills = jobData.skills;

    // 🔵 5. Skill Matching
    const result = matchingService.matchSkills(
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

    // 🔵 7. Final Response
    const savedResume = await Resume.create({
      fileName: req.file.filename,
      filePath,
      text,
      atsScore: result?.atsScore ?? 0,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      suggestions,
      createdAt: new Date()
    });

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