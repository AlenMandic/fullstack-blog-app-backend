const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

// every user who logs in will have his own collection of blogs which belong to him, as an array of MongoDB ID's. 'blogs' array
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 30,
    unique: true
  },
  name: {
    type: String,
    minLength: 3,
    maxLength: 30,
    required: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog' // references the 'Blog' model via the ID above
    }
  ],
  likedBlogs: [
    {
      type: mongoose.Schema.Types.ObjectID,
      ref: 'Blog'
    }
  ]
})

// when new mongoose Model 'User' gets submitted through our /api/users route, transform the end data like so. Hide/remove the password hash, prettify data.
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash // the password hash should not be revealed
  }
})

userSchema.plugin(uniqueValidator)
const User = mongoose.model('user', userSchema)

module.exports = User  // export our User model collection for use across the app.