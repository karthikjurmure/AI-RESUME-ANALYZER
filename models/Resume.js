const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({

    fileName: String,

    filePath: String,

    text: String,

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