require("dotenv").config();
const { Worker } = require("bullmq");
const connectDB = require("./config/db");
const redisConnection = require("./config/redis");
const { performAnalysis } = require("./services/analysisService");

// 1. Connect to Database
connectDB();

// 2. Initialize Worker
const worker = new Worker(
  "resume-analysis",
  async (job) => {
    console.log(`👷 Processing job ${job.id} for report ${job.data.reportId}...`);
    
    const { reportId, resumeText, jobDescription } = job.data;
    
    try {
      await performAnalysis(reportId, resumeText, jobDescription);
      console.log(`✅ Job ${job.id} completed successfully!`);
    } catch (error) {
      console.error(`❌ Job ${job.id} failed:`, error.message);
      throw error; // Let BullMQ handle retries if configured
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs at once
  }
);

worker.on("ready", () => {
    console.log("🚀 Worker is ready and waiting for jobs...");
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed with error: ${err.message}`);
});

worker.on("error", (err) => {
  console.error("❌ Worker error:", err.message);
});
