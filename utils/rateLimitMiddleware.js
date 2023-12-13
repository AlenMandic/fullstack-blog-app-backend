// need to add more specific limiters.

const rateLimit = require("express-rate-limit")

const globalLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 8815, // 215 requests every 15 minutes
  message: "You are sending too many requests. Try again later.",
  headers: true,
})

module.exports = { globalLimiter }