const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  postedBy: {
    username: String,
    id: String,
  },
  commentContent: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 200
  },
});

// every new blog created will have a reference to the user who created it, by giving it that user's ID.
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 60,
  },
  author: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 60,
  },
  url: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 100,
  },
  likes: Number,
  postedBy: {
    username: String,
    id: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user' // references the 'User' model via the ID
  },
  comments: [commentSchema]
})

// return prettier data for us to use. Prettify the 'id' by extracting just the raw number id as a string, and remove the __v key from mongodb.
blogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const blogModel = mongoose.model('Blog', blogSchema)

module.exports = blogModel  // export our Blog model collection for use across the app.