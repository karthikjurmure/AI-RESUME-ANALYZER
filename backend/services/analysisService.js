const Resume = require("../models/Resume");
const aiService = require("./aiServices");
const matchingService = require("./matchingService");

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

exports.performAnalysis = async (reportId, text, jobDescription) => {
  try {
    // 🔵 1. AI Resume Analysis
    const aiResume = await aiService.analyzeResume(text);
    const resumeData = extractJSON(aiResume);
    const resumeSkills = resumeData ? resumeData.skills : [];

    if (!resumeSkills || resumeSkills.length === 0) {
        throw new Error("Failed to extract resume data");
    }

    // 🔵 2. AI Job Skills
    const aiJob = await aiService.extractJobSkills(jobDescription);
    const jobData = extractJSON(aiJob);
    const jobSkills = jobData ? jobData.skills : [];

    if (!jobSkills || jobSkills.length === 0) {
        throw new Error("Failed to extract job data");
    }

    // 🔵 3. Skill Matching
    const result = await matchingService.matchSkills(
      resumeSkills,
      jobSkills
    );

    // 🔵 4. AI Suggestions
    const aiSuggestions = await aiService.getSuggestions(
      result.missingSkills,
      jobDescription
    );

    const suggestionData = extractJSON(aiSuggestions);
    const rawSuggestions = suggestionData?.suggestions || [];
    const suggestions = rawSuggestions.map(s => {
      if (typeof s === 'string') return s;
      if (typeof s === 'object' && s !== null) {
        return s.content || s.suggestion || s.text || JSON.stringify(s);
      }
      return String(s);
    });

    // 🔵 5. Link Auditor
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

    // 🔵 6. Update MongoDB
    await Resume.findByIdAndUpdate(reportId, {
      atsScore: result?.atsScore ?? 0,
      matchedSkills: result.matchedSkills,
      missingSkills: result.missingSkills,
      suggestions: suggestions,
      status: 'Completed'
    });

    return { success: true };

  } catch (error) {
    console.error("Analysis Error:", error);
    await Resume.findByIdAndUpdate(reportId, { status: 'Failed' });
    throw error;
  }
};
