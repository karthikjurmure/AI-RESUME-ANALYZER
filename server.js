require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");


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