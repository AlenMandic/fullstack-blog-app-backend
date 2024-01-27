// route for authenticating logins and assigning JWT's to logged in users.
const jwt = require('jsonwebtoken') // for generating a JSON web token for authorization
const bcrypt = require('bcrypt') // to compare incoming password to it's hash in our db. If it matches, good login.
const loginRouter = require('express').Router()
const User = require("../models/user")

// authenticate incoming logins
loginRouter.post('/', async (req, res, next) => {
  try {
    const { username, password } = req.body // receive a username and password.

    const user = await User.findOne({ username })

    // if user doesn't exist fail the login attempt, else check the password.
    const passwordCorrect = user === null ? false : await bcrypt.compare(password, user.passwordHash)

    // if user exists and is found, and it's passwordHash matches the password, login will work. Otherwise fail it
    if(!(user && passwordCorrect)) {
      return res.status(401).json({ error: 'Username or password incorrect.' })
    }

    //let's start designing our JWT structure. For now let's give it a username who's logging in, his ID, and an expiry date of 1 hour.
    const userForToken = {
      username: user.username,
      id: user._id,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // expires in (current time in seconds + 3,600 seconds) 1 hour.
    }

    const token = jwt.sign(userForToken, process.env.SECRET) // create a new token signed digitally with our 'SECRET' signature string

    // if all of the above is good, let's send back a status of 200, and the token itself so we can use it on the front-end to verify requests. This is a succesfull login and the front-end has their token.
    return res.status(200).send({ token, username: user.username, name: user.name, id: user._id })

  } catch(err) {
    next(err)
  }

})

module.exports = loginRouter