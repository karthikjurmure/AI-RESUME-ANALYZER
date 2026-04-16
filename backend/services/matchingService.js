const aiService = require("./aiServices");
const { pipeline } = require('@xenova/transformers');

let extractor = null;

async function getExtractor() {
  if (!extractor) {
    console.log("📥 Loading local Semantic Model (MiniLM)...");
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
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
}exports.matchSkills = async (rawResumeSkills, rawJobSkills) => {
  try {
    const resumeSkills = normalizeArray(rawResumeSkills);
    const jobSkills = normalizeArray(rawJobSkills);

    console.log("📦 Target Normalized Resume:", resumeSkills);
    console.log("📦 Target Normalized Job:", jobSkills);

    if (resumeSkills.length === 0 || jobSkills.length === 0) {
      return {
        matchedSkills: [],
        missingSkills: jobSkills,
        atsScore: 0
      };
    }

    const extractor = await getExtractor();
    const sanitize = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, '');
    
    console.log("🚀 Generating local embeddings...");
    const resumeEmbeds = await Promise.all(resumeSkills.map(async s => ({
      skill: s,
      embed: (await extractor(s, { pooling: 'mean', normalize: true })).data
    })));

    const jobEmbeds = await Promise.all(jobSkills.map(async s => ({
      skill: s,
      embed: (await extractor(s, { pooling: 'mean', normalize: true })).data
    })));

    const matchedJDSanitized = new Set();
    const matchesDetails = [];
    const bestCandidatePerJD = {};

    jobEmbeds.forEach(job => {
      const jdKey = sanitize(job.skill);
      resumeEmbeds.forEach(res => {
        const score = cosineSimilarity(job.embed, res.embed);
        if (score > 0.85) {
          console.log(`✅ Local Semantic Match: "${res.skill}" -> "${job.skill}" (Score: ${Math.round(score * 100)}%)`);
          matchedJDSanitized.add(jdKey);
          matchesDetails.push({
            resume_skill: res.skill,
            jd_skill: job.skill,
            reasoning: `High-confidence local semantic match (${Math.round(score * 100)}%).`,
            score
          });
        } else if (score >= 0.35 && !matchedJDSanitized.has(jdKey)) {
          if (!bestCandidatePerJD[jdKey] || score > bestCandidatePerJD[jdKey].score) {
            bestCandidatePerJD[jdKey] = { resume_skill: res.skill, jd_skill: job.skill, score };
          }
        }
      });
    });

    const ambiguousPairs = Object.values(bestCandidatePerJD)
      .filter(p => !matchedJDSanitized.has(sanitize(p.jd_skill)))
      .map(p => ({ resume_skill: p.resume_skill, jd_skill: p.jd_skill }));

    console.log(`🧠 Local Semantic Matches Found: ${matchedJDSanitized.size}`);
    console.log(`🧠 Ambiguous Pairs requiring AI Verification: ${ambiguousPairs.length}`);
    
    if (ambiguousPairs.length > 0) {
      console.log("📝 Pairs being sent to AI:");
      ambiguousPairs.forEach(p => console.log(`   - "${p.resume_skill}" vs "${p.jd_skill}"`));
      console.log("🚀 Pinging AI Intelligence Layer for Semantic Verification...");
      const aiResponse = await aiService.reviewAmbiguousMatches(ambiguousPairs);
      const evaluations = extractJSON(aiResponse);

      if (Array.isArray(evaluations)) {
        evaluations.forEach(evalObj => {
          const jdKey = sanitize(evalObj.jd_skill);
          if (matchedJDSanitized.has(jdKey)) return;
          const isMatch = evalObj.isMatch === true || String(evalObj.isMatch).toLowerCase() === 'true';
          if (isMatch) {
            matchedJDSanitized.add(jdKey);
            matchesDetails.push({
              resume_skill: evalObj.resume_skill,
              jd_skill: evalObj.jd_skill,
              reasoning: "AI Verification: " + evalObj.reasoning,
              ai_confidence: evalObj.confidenceScore
            });
          }
        });
      }
    }

    const finalMatchedJD = [];
    const missingJD = [];
    jobSkills.forEach(jd => {
      if (matchedJDSanitized.has(sanitize(jd))) {
        finalMatchedJD.push(jd);
      } else {
        missingJD.push(jd);
      }
    });

    const atsScore = jobSkills.length > 0 ? Math.round((finalMatchedJD.length / jobSkills.length) * 100) : 0;

    return {
      matchedSkills: finalMatchedJD,
      missingSkills: missingJD,
      atsScore: atsScore,
      matches_details: matchesDetails
    };

  } catch (error) {
    console.error("FATAL ERROR in Matching logic:", error.message);
    return {
      matchedSkills: ["❌ Analysis Failed"],
      missingSkills: [error.message],
      atsScore: 0
    };
  }
};