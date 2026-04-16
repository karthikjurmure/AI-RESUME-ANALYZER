require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const app = require("./app");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log("📁 Created uploads directory");
}


mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log("📊 Database:", mongoose.connection.name);
    app.listen(5000, () => {
        console.log("🚀 Server running on http://localhost:5000");
    });
})
.catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
});