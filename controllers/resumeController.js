const Resume = require("../models/Resume");
const pdfService = require("../services/pdfService");
const aiService=require("../services/aiServices");
const axios = require("axios");
exports.getResumes=async(req,res)=>{
    try{
        const resumes= await Resume.find();
        res.json(resumes);
    }
    catch(err){
        res.status(500).json({
            message:"Error fetching resumes"
        });
    }
}
exports.uploadResume = async (req,res)=>{
    const filePath = req.file.path;
    const text = await pdfService.extractText(filePath);
    const aiAnalysis = await aiService.analyzeResume(text);

let parsedAnalysis = {};

try {
  const jsonMatch = aiAnalysis.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    parsedAnalysis = JSON.parse(jsonMatch[0]);
  }
} catch (error) {
  console.log("AI response parsing failed:", error);
}

const resume = await Resume.create({
  fileName: req.file.filename,
  filePath,
  text,
  analysis: parsedAnalysis,
  status: "processed"
});
    res.json({
        message:"Resume uploaded",
        resumeId: resume._id
    });
}