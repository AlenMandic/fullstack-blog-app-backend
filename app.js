const path = require('path');
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

// fixes express-rate-limiter when deploying from a proxy
app.set('trust proxy', 1);

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))
app.use(helmet())
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "img-src": ["'self'", "https: data:"]
    }
  })
)

// connect to our mongo database.
const mongoUrl = config.MONGODB_URL
mongoose.set('strictQuery', false)

mongoose.connect(mongoUrl).then(() => {
  logger.info('Connected to MongoDB database')

}).catch(error => logger.error('Connecting to DB failed:', error.message))

app.use(rateLimiters.globalLimiter)
app.use(middleware.requestLogger)
app.use("/blogs", blogRouter)
app.use("/users", userRouter)
app.use("/login", loginRouter)

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app