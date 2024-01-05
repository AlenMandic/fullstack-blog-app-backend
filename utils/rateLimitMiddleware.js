// need to add more specific limiters.

const rateLimit = require("express-rate-limit")

const globalLimiter = rateLimit({
  windowMs: 18000000, // 5hours
  max: 500, // 500 requests every 5 hours
  message: "You are sending too many requests. Try again later.",
  headers: true,
})

module.exports = { globalLimiter }