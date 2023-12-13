const logger = require("./logger")
const jwt = require("jsonwebtoken")
const User = require("../models/user")

const getTokenFrom = request => {
  const authorization = request.get('authorization') // check the value of 'authorization' header in incoming request.

  // if 'authorization' header exists and starts with 'Bearer '. Otherwise access will be denied.
  if(authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '') // returns only our encoded token string
  }
  return null
}

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const userExtractor = async (request, response, next) => {

  try {
    console.log('User extractor middleware for authenticating users running.')
    const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET)
    console.log("Decoded token for user: ", decodedToken.username)

    if(!(decodedToken.id)) {
      console.log("Token didn't have id field. Denied.")
      return response.status(401).json({ error: "Invalid token. Access denied." })
    }

    const user = await User.findById(decodedToken.id)

    console.log('User making the request: ', user.username, user._id)
    request.user = user // add a new field to the received request before it reaches our router which contains whoever is making the request.

    next()  // now our routes will have the user and we can move on to next middlewares

  } catch(err) {
    next(err)
  }
}

const unknownEndpoint = (request, response) => {
  logger.error('unknown endpoint request', request.path)
  response.status(404).send('<h2>Unknown endpoint!</h2>')
}

// need to check if all errors are working for password/username validators
const errorHandler = (error, req, res, next) => {
  console.log(error.name)
  console.log(error.message)

  if(error.name === 'CastError') {
    res.status(400).send('Invalid or non-existant ID')
  } else if (error.name === 'ValidationError') {
    return res.status(400).send({ error: error.message })
  } else if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token must be provided. Denied.' })
  }  else if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired. Log in again.' })
  } else {
    res.status(400).send(error.message)
  }
  next(error)
}

module.exports = { requestLogger, userExtractor, unknownEndpoint, errorHandler }