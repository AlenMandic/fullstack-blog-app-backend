const mongoose = require('mongoose')

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
  userId: { // user this blog belongs to!
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user' // Indicates that this userId property points to 'User' model data. We can then do .populate('userId') to return every single User document instead of just the ID's.
  }
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