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
        ]
      },
      { headers }
    );

    return response.data.choices[0].message.content;

  } catch (error) {
    console.log("AI ERROR 👉", error.response?.data || error.message);
    throw error;
  }
}

// 🔹 Resume Analysis
exports.analyzeResume = async (resumeText) => {
  const prompt = `
You are a resume parser.

Extract:
- skills
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
Extract ONLY technical skills from this job description.

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

Return ONLY JSON:

{
 "suggestions": []
}
`;

  return await callAI(prompt);
};