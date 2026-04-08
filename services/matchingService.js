const axios = require('axios');
const aiService = require("./aiServices");
const normalizeArray = (arr) => {
  if (!arr) return [];
  if (typeof arr === 'string') {
    return arr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }
  if (!Array.isArray(arr)) {
    if (typeof arr === 'object') return Object.values(arr).map(v => String(v));
    return [];
  }
  return arr.flatMap(item => {
    if (typeof item === 'object' && item !== null) {
      return Object.values(item).map(v => String(v));
    }
    return String(item).split(',').map(s => s.trim());
  }).filter(s => s.length > 0);
};

function extractJSON(text) {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      // Fallback to object matching if it wasn't an array
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (!objMatch) return null;
      return JSON.parse(objMatch[0]);
    }
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("JSON parse failed 👉", err);
    return null;
  }
}

exports.matchSkills = async (rawResumeSkills, rawJobSkills) => {
  try {
    const resumeSkills = normalizeArray(rawResumeSkills);
    const jobSkills = normalizeArray(rawJobSkills);

    console.log("📦 Target Normalized Resume:", resumeSkills);
    console.log("📦 Target Normalized Job:", jobSkills);

    if (resumeSkills.length === 0) {
      return {
        matchedSkills: ["❌ FATAL: AI Extracted ZERO Resume Skills! PDF is blank or unreadable."],
        missingSkills: jobSkills,
        atsScore: 0
      };
    }

    if (jobSkills.length === 0) {
      return {
        matchedSkills: ["❌ FATAL: AI Extracted ZERO Job Skills!"],
        missingSkills: ["Check your Job Description input"],
        atsScore: 0
      };
    }
    console.log("🚀 Pinging Python Fast-Filter...");
    console.log("📤 Sending to Python → resumeSkills:", resumeSkills);
    console.log("📤 Sending to Python → jobSkills:", jobSkills);
    const pyResponse = await axios.post('http://127.0.0.1:8000/match-skills', {
      resume_skills: resumeSkills,
      jd_skills: jobSkills
    });

    const pairs = pyResponse.data.pairs || [];
    console.log("📥 Python returned", pairs.length, "pairs");
    const sanitize = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, '');

    const matchedJDSanitized = new Set();
    const matchesDetails = [];

    // Group all pairs by JD skill, keeping only the best resume match per JD skill
    const bestCandidatePerJD = {};
    pairs.forEach(pair => {
      const { resume_skill, jd_skill, score } = pair;
      const key = sanitize(jd_skill);

      if (score > 0.85) {
        // Direct high-confidence match — mark as matched immediately
        matchedJDSanitized.add(key);
        matchesDetails.push({
          resume_skill,
          jd_skill,
          reasoning: "High-confidence local semantic match (> 0.85).",
          score
        });
      } else if (score >= 0.30) {
        // Track the best candidate for each JD skill in the ambiguous zone
        if (!bestCandidatePerJD[key] || score > bestCandidatePerJD[key].score) {
          bestCandidatePerJD[key] = { resume_skill, jd_skill, score };
        }
      }
    });

    // Build final ambiguous list: only unmatched JD skills with their best candidate
    const ambiguousPairs = Object.values(bestCandidatePerJD)
      .filter(p => !matchedJDSanitized.has(sanitize(p.jd_skill)))
      .map(p => ({ resume_skill: p.resume_skill, jd_skill: p.jd_skill }));

    console.log(`🧠 High Confidence Matches: ${matchedJDSanitized.size}`, [...matchedJDSanitized]);
    console.log(`🧠 Ambiguous Pairs requiring LLM: ${ambiguousPairs.length}`, ambiguousPairs);


    if (ambiguousPairs.length > 0) {
      console.log("🚀 Pinging OpenRouter Intelligence Layer...");
      const aiResponse = await aiService.reviewAmbiguousMatches(ambiguousPairs);
      const evaluations = extractJSON(aiResponse);

      if (Array.isArray(evaluations)) {
        evaluations.forEach(evalObj => {
          // Be flexible: DeepSeek can sometimes return "true" (string) or true (boolean)
          const isMatch = evalObj.isMatch === true || String(evalObj.isMatch).toLowerCase() === 'true';

          if (isMatch) {
            matchedJDSanitized.add(sanitize(evalObj.jd_skill));
            matchesDetails.push({
              resume_skill: evalObj.resume_skill,
              jd_skill: evalObj.jd_skill,
              reasoning: "AI Verification: " + evalObj.reasoning,
              ai_confidence: evalObj.confidenceScore
            });
          }
        });
      } else {
        console.warn("⚠️ AI returned invalid format for ambiguous pairs.");
      }
    }

    // 4. Calculate Missing Skills and Final ATS Score
    const finalMatchedJD = [];
    const missingJD = [];

    // Determine missing strings while preserving the original strings for UI formatting
    jobSkills.forEach(jd => {
      if (matchedJDSanitized.has(sanitize(jd))) {
        finalMatchedJD.push(jd);
      } else {
        missingJD.push(jd);
      }
    });

    const atsScore = jobSkills.length > 0
      ? Math.round((finalMatchedJD.length / jobSkills.length) * 100)
      : 0;

    const finalPayload = {
      matchedSkills: finalMatchedJD,
      missingSkills: missingJD,
      atsScore: atsScore,
      matches_details: matchesDetails
    };

    console.log("✅ FINAL PAYLOAD → atsScore:", atsScore, "matched:", finalMatchedJD, "missing:", missingJD);
    return finalPayload;

  } catch (error) {
    const errMsg = "FATAL ERROR in Orchestrator Pipeline: " + error.message;
    console.error(errMsg);
    if (error.response) {
      console.error(error.response.data);
    }
    return {
      matchedSkills: ["❌ Pipeline Failed"],
      missingSkills: [errMsg, "Check node server.js console for more info"],
      atsScore: 0
    };
  }
};
