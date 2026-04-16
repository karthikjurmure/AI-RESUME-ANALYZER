const { Queue } = require("bullmq");
const redisConnection = require("./redis");

const analysisQueue = new Queue("resume-analysis", {
  connection: redisConnection,
});

module.exports = {
  analysisQueue,
};
