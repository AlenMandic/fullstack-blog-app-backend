// route for when a new user is registering and fetching  user information.
const userRouter = require('express').Router()
const User = require('../models/user')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const middleware = require("../utils/middleware")

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+])[A-Za-z\d!@#$%^&*()_+]{15,80}$/;

function isStrongPassword(ourPassword) {
  return passwordRegex.test(ourPassword)
}

userRouter.get('/', async (req, res) => {

  const ourUsers = await User.find({}).populate('blogs', { title: 1, author: 1, url: 1, likes: 1 })
  return res.json(ourUsers)

})

userRouter.get('/:id', async (req, res, next) => {

  try {
    const id = req.params.id

    const result = await User.findById(id).populate('blogs')

    if(result !== null) {
      return res.json(result)
    }

    return res.status(404).send('Error: Invalid ID')

  } catch(err) {
    next(err)
  }
})

// retrieve a user's liked blogposts
userRouter.get('/:id/likes', async (req, res, next) => {
  try {

    const id = req.params.id

    const user = await User.findOne({ username: id })

    return res.status(200).json(user.likedBlogs)

  } catch(err) {
    next(err)
  }
})

// retrieve blogs belonging to a specific user
userRouter.get('/:id/blogs', async (req, res, next) => {
  try {

    const id = req.params.id

    const user = await User.findOne({ username: id })

    const userBlogsToDisplay = await Blog.find({ userId: user._id })

    return res.status(200).json(userBlogsToDisplay)

  } catch(err) {
    next(err)
  }
})

// deletes an entire user profile, and all of the user's associated blogs
userRouter.delete('/:id', middleware.userExtractor, async (req, res, next) => {
  const id = req.params.id
  const user = req.user

  // if user is authenticated and is trying to delete his own content
  if(user && (user.id === id)) {

    try {
      const userToDelete = user

      const userBlogsToRemove = user.blogs

      if(userBlogsToRemove.length === 0) {
        await User.findByIdAndRemove(userToDelete._id)
        return res.status(204).end()
      }

      await Blog.deleteMany({ userId: userToDelete._id })

      await User.findByIdAndRemove(userToDelete._id)

      return res.status(204).end()
    } catch(err) {
      next(err)
    }
  }

  return res.status(400).json({ error: "You must be logged in to perform this action." })

})
// sign-up new user route
userRouter.post('/', async (req, res, next) => {

  try {
    const { username, name, password } = req.body

    if(!(isStrongPassword(password))) {
      return res.status(400).json({ error: 'Password must be 15 characters or more and include 1 capital letter, 1 number, and 1 special character!' })
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds) // hashed, secured password with 10 salt rounds.
    // we don't store the actual password to the db, we only store the hashed version.

    const user = new User({
      username,
      name,
      passwordHash
    })

    const savedUser = await user.save()
    return res.status(201).json(savedUser)

  } catch(err) {
    next(err)
  }

})

module.exports = userRouter