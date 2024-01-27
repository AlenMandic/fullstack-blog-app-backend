const blogRouter = require('express').Router()
const Blog = require("../models/blog")
const User = require("../models/user")
const middleware = require("../utils/middleware")

blogRouter.get("/", async (req, res) => {

  let { page, limit } = req.query
  const skip = (page - 1) * limit  // pagination skipper.

  page = parseInt(page) || 1
  limit = parseInt(limit) || 10

  const blogs = await Blog.find({}).populate('userId', { username: 1, name: 1 }).skip(skip).limit(limit)

  return res.json(blogs)
})

// User can add a new blogpost
blogRouter.post("/", middleware.userExtractor, async (req, res, next) => {

  const user = req.user

  if(user) {
    try {

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
// adds a new comment from a logged in user to an individual blog post
blogRouter.post("/:id/comments", middleware.userExtractor, async (req, res, next) => {

  const id = req.params.id
  const user = req.user
  const commentContent = req.body.commentContent

  if(user) {

    try {

      const blog = await Blog.findById(id);

      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }

      const newComment = {
        postedBy: {
          username: user.username,
          id: user.id,
        },
        commentContent,
      };

      blog.comments.push(newComment);

      await blog.save();

      return res.status(201).json(newComment);

    } catch(err) {
      next(err)
    }
  }

  return res.status(401).json({ error: "You must be logged in to comment." })

})

// User can delete his own individual blog posts if logged in.
blogRouter.delete("/:id", middleware.userExtractor, async (req, res, next) => {
  const id = req.params.id
  const user = req.user

  if(user) {
    try {

      const userToUpdateArray = user

      const blogIndex = userToUpdateArray.blogs.indexOf(id)

      // if blog exists in user's blog array
      if(blogIndex !== -1) {
        const blogToDelete = userToUpdateArray.blogs[blogIndex]

        await User.findByIdAndUpdate(
          userToUpdateArray,
          { $pull: { blogs: blogToDelete._id } },  // Go into userToUpdateArray.blogs and remove one using ID
          { new: true } // return updated document
        )

        await Blog.findOneAndDelete(blogToDelete)

        return res.status(204).end()
      }

    } catch(err) {
      next(err)
    }
  }

  return res.status(401).json({ error: "You must be logged in to delete." })

})

// Activated via the like/unlike button. A logged in user can give 1 like to any blog on the explore page, and/or remove it after.
blogRouter.put("/:id", middleware.userExtractor, async(req, res, next) => {

  const body = req.body
  const user = req.user
  const id = req.params.id

  if(user) {
    try {

      // check if the user has already liked the post or not.
      const isLiked = user.likedBlogs.includes(id)

      const blogToUpdate = await Blog.findById(id)

      const newLikes = body.likes

      if(isLiked) {
        user.likedBlogs = user.likedBlogs.filter(likedBlogId => likedBlogId.toString() !== id);
      } else {
        user.likedBlogs.push(id)
      }

      await user.save()  // updated user liked blogs information

      blogToUpdate.likes = newLikes

      const updatedBlog = await Blog.findByIdAndUpdate(id, blogToUpdate, { new: true, runValidators: true, context: 'query' })
      return res.json(updatedBlog)

    } catch(err) {
      next(err)
    }
  }

  return res.status(401).json({ error: "You must be logged in to perform this action." })
})

module.exports = blogRouter