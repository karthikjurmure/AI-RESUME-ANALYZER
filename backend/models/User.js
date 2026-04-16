const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: { 
        type: String, 
        required: true 
    }
}, { timestamps: true });

// Handle duplicate key errors
userSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Email already exists'));
    } else {
        next(error);
    }
});

module.exports = mongoose.model("User", userSchema);