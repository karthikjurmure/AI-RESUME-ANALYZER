const mongoose = require("mongoose");
const resumeSchema = new mongoose.Schema({
    fileName: String,
    filePath: String,
    text: String,
    atsScore: Number,
    matchedSkills: [String],
    missingSkills: [String],
    suggestions: [String],

    createdAt: {
      type: Date,
      default: Date.now
    }
});
module.exports = mongoose.model("Resume", resumeSchema);