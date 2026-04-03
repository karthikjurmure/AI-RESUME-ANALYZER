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
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
});
module.exports = mongoose.model("Resume", resumeSchema);