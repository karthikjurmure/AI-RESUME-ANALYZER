const axios = require("axios");

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

const headers = {
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": "http://localhost:5000",
  "X-Title": "resume-ai-analyzer"
};

// 🔹 Common AI caller
async function callAI(prompt) {
  try {
    const response = await axios.post(
      BASE_URL,
      {
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000
      },
      { headers }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.log("AI ERROR 👉", error.response?.data || error.message);
    throw error;
  }
}

// 🔹 Ambiguous Matches Evaluator
exports.reviewAmbiguousMatches = async (ambiguousPairs) => {
  if (!ambiguousPairs || ambiguousPairs.length === 0) return '[]';
  
  const prompt = `
Act as an expert Technical Recruiter and SDE Interviewer. Your task is to perform a high-precision semantic comparison between "Resume Skills" and "Job Description Skills".

### INPUT DATA:
Evaluate the following pairs:
${JSON.stringify(ambiguousPairs, null, 2)}

### EVALUATION RULES:
1. SEMANTIC EQUIVALENCE: Match if they are synonyms (e.g., "NodeJS" and "Node.js").
2. CATEGORICAL MAPPING: Match if the Resume Skill is a specific implementation of a broader JD Category (e.g., "React" matches "Frontend Frameworks").
3. CONTEXTUAL RELEVANCE: Only match if the relationship is direct. Do NOT match "Docker" with "Frontend Frameworks" just because they are both tech tools.
4. STRICTNESS: Be objective. If the skills are unrelated (e.g., "Python" vs "CSS"), they are NOT a match.

### RESPONSE FORMAT:
You must return ONLY a JSON array containing the evaluation for EACH pair provided in the input. No prose, no explanations outside the JSON.

[
  {
    "resume_skill": "string",
    "jd_skill": "string",
    "isMatch": boolean,
    "confidenceScore": 0.0,
    "reasoning": "A one-sentence explanation of why they match or don't.",
    "category": "The tech category they belong to"
  }
]
`;

  return await callAI(prompt);
};

// 🔹 Resume Analysis
exports.analyzeResume = async (resumeText) => {
  const prompt = `
You are a resume parser.

Extract:
- skills (Must be a list of strictly short, individual skill names like "React", "Node.js". Do NOT group them into long strings or sentences)
- achievements
- email
- phone
- years_of_experience

Return ONLY valid JSON.

{
 "skills": [],
 "achievements": [],
 "email": "",
 "phone": "",
 "years_of_experience": ""
}

Resume:
${resumeText}
`;

  return await callAI(prompt);
};

// 🔹 Job Skills Extraction
exports.extractJobSkills = async (jobDescription) => {
  const prompt = `
Extract ONLY technical skills from this job description as a list of short, distinct individual items (e.g. "Node.js", "Version Control"). Do NOT group them into sentences or use descriptive adjectives.

Return ONLY JSON:

{
 "skills": []
}

Job Description:
${jobDescription}
`;

  return await callAI(prompt);
};

// 🔹 Suggestions Generator
exports.getSuggestions = async (missingSkills, jobDescription) => {
  const prompt = `
Given missing skills: ${missingSkills.join(", ")}

Based on this job description:
${jobDescription}

Suggest improvements for a resume.

Return ONLY JSON where "suggestions" is a list of plain strings:

{
 "suggestions": [
   "First suggestion...",
   "Second suggestion..."
 ]
}
`;

  return await callAI(prompt);
};

// 🔹 Link Auditor Evaluator
exports.auditLinks = async (links) => {
  if (!links || links.length === 0) return null;
  
  const prompt = `
You are a Technical Career Consultant reviewing links found in a candidate's resume.

Analyze the following links:
${JSON.stringify(links, null, 2)}

For each link, check:
1. Is the username/slug professional (e.g., avoid cool-gamer-99 style usernames)?
2. Is the URL secure (HTTPS)? Flag any HTTP or shortened URLs (bit.ly, tinyurl, etc.) as risky.
3. What should the recruiter find on that platform, and is the link likely to meet expectations?

Then produce a short list of ACTIONABLE improvement suggestions the candidate should make to their online presence.

Rules:
- Write each suggestion as a single, concise, plain-English sentence (no markdown, no headers, no bullet symbols).
- Do NOT include table formatting.
- Do NOT include a "Key Improvement Suggestion" section.
- Each suggestion must be self-contained and specific (mention the platform or link involved).
- Return ONLY a valid JSON array of strings, nothing else.

Example format:
["Replace the bit.ly link with a direct HTTPS portfolio URL to avoid corporate security filters.", "Rename the GitHub username from cool-gamer-99 to a professional handle matching your name."]
`;

  return await callAI(prompt);
};