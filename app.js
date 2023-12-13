const middleware = require("./utils/middleware.js")
const rateLimiters = require("./utils/rateLimitMiddleware.js")
const helmet = require("helmet")
const cors = require('cors')
const express = require('express')
const blogRouter = require("./controllers/blogs.js")
const userRouter = require("./controllers/users.js")
const loginRouter = require("./controllers/login.js")
const mongoose = require("mongoose")
const logger = require("./utils/logger.js")
const config = require("./utils/config.js")
// initiliaze an express application.
const app = express()

app.get("/", (req, res) => {
  res.send('<h1>Welcome to our starter api for my bloglist app.</h1>')
})
app.use(cors())
app.use(express.json())
app.use(helmet())

// connect to our mongo database.
const mongoUrl = config.MONGODB_URL
mongoose.set('strictQuery', false)
logger.info('connecting to: ', mongoUrl)

mongoose.connect(mongoUrl).then(() => {
  logger.info('Connected to MongoDB database')

}).catch(error => logger.error('Connecting to DB failed:', error.message))

app.use(rateLimiters.globalLimiter)
app.use(middleware.requestLogger)
app.use("/api/blogs", blogRouter)
app.use("/api/users", userRouter)
app.use("/api/login", loginRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app