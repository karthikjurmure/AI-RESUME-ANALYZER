const mongoose = require("mongoose");
const resumeSchema = new mongoose.Schema({
    fileName: String,
    filePath: String,
    text: String,
    analysis: {
  type: Object,
  default: {}
},
    status: {
        type: String,
        enum: ["uploaded", "processed"],
        default: "uploaded"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model("Resume", resumeSchema);