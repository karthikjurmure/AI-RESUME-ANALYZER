const axios = require("axios");

exports.analyzeResume = async (resumeText) => {

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "deepseek/deepseek-chat",
      messages: [
        {
          role: "user",
          content: `
Extract the following information from this resume:

skills
achievements
email
phone
years of experience

Return the result strictly in JSON format.

Resume:
${resumeText}
`
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "resume-ai-analyzer"
      }
    }
  );

  return response.data.choices[0].message.content;
};