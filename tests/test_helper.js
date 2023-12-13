const Blog = require('../models/blog') // our Blogs collection.
const supertest = require('supertest')
const app = require("../app")
const api = supertest(app)

//initiliaze a testing mongoDB for JEST testing.
const initialBlogs = [
  {
    title: 'Random Blog 1',
    author: 'Random author 1',
    url: 'Random url 1',
    likes: 55,
  },
  {
    title: 'Random Blog 2',
    author: 'Random author 2',
    url: 'Random url 2',
    likes: 65,
  },
  {
    title: 'Random Blog 3',
    author: 'Random author 3',
    url: 'Random url 3',
    likes: 75,
  },
]

// return a list of blogs.
const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

// register a new user to the testing DB so we can use him to test protected routes.
const registerNewUser = async (ourUsername, ourName, ourPassword) => {

  const newTestUser = {
    username: ourUsername,
    name: ourName,
    password: ourPassword
  }

  const request = await api.post('/api/users').send(newTestUser)
  expect(request.status).toBe(201)
}

const loginUser = async (username, password) => {

  const request = await api.post('/api/login').send({ username, password })
  expect(request.status).toBe(200)
  console.log('test helper token check: ', request.body.token)
  return request.body.token
}

module.exports = { initialBlogs, blogsInDb, registerNewUser, loginUser }