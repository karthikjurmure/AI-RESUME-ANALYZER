const Resume = require("../models/Resume");
const pdfService = require("../services/pdfService");
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

    const resume = await Resume.create({

        fileName: req.file.filename,
        filePath,
        text,
        status:"processed"

    });

    res.json({
        message:"Resume uploaded",
        resumeId: resume._id
    });

}