const blogRouter = require('express').Router()
const Blog = require("../models/blog")
const User = require("../models/user")
const middleware = require("../utils/middleware")

blogRouter.get("/", async (req, res) => {

  let { page, limit } = req.query
  const skip = (page - 1) * limit  // pagination skipper.

  page = parseInt(page) || 1
  limit = parseInt(limit) || 5

  const blogs = await Blog.find({}).populate('userId', { username: 1, name: 1 }).skip(skip).limit(limit)

  res.json(blogs)
})

// User can add a new blogpost
blogRouter.post("/", middleware.userExtractor, async (req, res, next) => {

  const user = req.user

  if(user) {
    try {
      console.log("Logging request authorization header for protected route -> Posting to: /api/blogs/: ", req.headers.authorization)
      console.log('User is attempting to save blog: ', req.body)

      const blog = new Blog({
        title: req.body.title,
        author: req.body.author,
        url: req.body.url,
        likes: req.body.likes,
        postedBy: {
          username: user.username,
          id: user.id
        },
        userId: user.id
      })

      if(blog.likes === undefined) {
        blog.likes = 0
      }

      if(blog.title === '') {
        return res.status(400).end()
      } else {

        const newBlog = await blog.save()

        user.blogs = user.blogs.concat(newBlog._id) // update the user's blog array with the new blog they're saving.
        await user.save() // save updated user information to the 'User' collection

        console.log(user.username, 'saved new blog: ', newBlog)
        console.log("Database user and blog info has been updated.")
        return res.status(201).json(newBlog)
      }
    } catch(err) {
      next(err)
    }
  }

  return res.status(400).json({ error: "You have to be logged in to post" })

})

blogRouter.get("/:id", async (req, res, next) => {
  const id = req.params.id

  try {
    const result = await Blog.findById(id).populate('userId', { username: 1, name: 1 })

    if(result) {
      return res.json(result)
    } else {
      return res.status(404).json({ error: "ID doesnt exist" })
    }

  } catch(err) {
    next(err)
  }
})
// User can delete his own individual blog posts if logged in.
blogRouter.delete("/:id", middleware.userExtractor, async (req, res, next) => {
  const id = req.params.id
  const user = req.user

  if(user) {
    try {

      const userToUpdateArray = user
      console.log('trying to update user blog-array after deletion for: ', userToUpdateArray)

      const blogIndex = userToUpdateArray.blogs.indexOf(id)

      // if blog exists in user's blog array
      if(blogIndex !== -1) {
        const blogToDelete = userToUpdateArray.blogs[blogIndex]
        console.log("Trying to find and delete this blog from user's blog array: ", blogToDelete)

        await User.findByIdAndUpdate(
          userToUpdateArray,
          { $pull: { blogs: blogToDelete._id } },  // Go into userToUpdateArray.blogs and remove one using ID
          { new: true } // return updated document
        )

        await Blog.findOneAndDelete(blogToDelete)

        console.log('Updated users blog array and removed blog')
        return res.status(204).end()
      }

    } catch(err) {
      next(err)
    }
  }

  res.status(400).json({ error: "You must be logged in to delete." })

})

// Activated via the like/unlike button. A logged in user can give 1 like to any blog on the explore page, and/or remove it after.
blogRouter.put("/:id", middleware.userExtractor, async(req, res, next) => {
  const body = req.body
  const user = req.user
  const id = req.params.id
  console.log("User is attempting to like/unlike: ", user.username, "------blog to like/unlike: ", id)

  if(user) {
    try {

      // check if the user has already liked the post or not.
      const isLiked = user.likedBlogs.includes(id)

      const blogToUpdate = await Blog.findById(id)
      console.log("before likes updated:", blogToUpdate)

      const newLikes = body.likes

      if(isLiked) {
        console.log("Blog already liked, removing it from liked blogs.")
        user.likedBlogs = user.likedBlogs.filter(likedBlogId => likedBlogId.toString() !== id);
      } else {
        console.log("Blog not liked, adding it to list of liked blogs.")
        user.likedBlogs.push(id)
      }

      await user.save()  // updated user liked blogs information

      blogToUpdate.likes = newLikes
      console.log('after likes updated:', blogToUpdate)

      const updatedBlog = await Blog.findByIdAndUpdate(id, blogToUpdate, { new: true, runValidators: true, context: 'query' })
      console.log("updated blog: ", updatedBlog)
      return res.json(updatedBlog)

    } catch(err) {
      next(err)
    }
  }

  return res.status(400).json({ error: "You must be logged in to perform this action." })
})

module.exports = blogRouter