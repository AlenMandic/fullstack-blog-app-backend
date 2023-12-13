const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require("../app")
const api = supertest(app)

const Blog = require("../models/blog")
const User = require("../models/user")

// jest function which runs before every test. We reset and clear out our test DB, and then feed it relevant data for testing. By doing this, we ensure our DB data is in the same state before every test.
beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})
  console.log('test db cleared and reset.')

  await helper.registerNewUser('testingusername1', 'testingname1', 'testingpassword1')
  const blogsArray = helper.initialBlogs.map(blog => new Blog(blog)) // initial test data made by our Blog schema
  const blogsToDb = blogsArray.map(blog => blog.save()) // this will contain an array of pending promises waiting to resolve. As they resolve one by one, their result is the actual blog we need. await Promise.all saves every single blog to our db, but it only saves them once every single blog has successfully "awaited" or resolved.
  await Promise.all(blogsToDb)

  //if we do: const resolvedBlogs = await Promise.all(blogstoDb) we will have an array of all the resolved blogs, and they will also be saved to the db.
})

describe('Basic initial tests and adding a blog', () => {

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('every Blog we have in the DB is returned', async () => {

    const response = await api.get('/api/blogs')
    console.log("Response from GET /api/blogs :", response.body)

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  })
})

describe('Specific tests regarding blog properties', () => {
  test('A specific blog title is in one of the blogs', async () => {
    const response = await helper.blogsInDb()
    const contents = response.map(blog => blog.title)  // return every single blog title so we can do our check.

    expect(contents).toContain('Random Blog 1')
  })

  test('A blog without a title cant be added', async () => {
    const user = await User.find({ username: 'testingusername1' })
    const id = user._id

    const authorizedUser = await helper.loginUser('testingusername1', 'testingpassword1')

    const newBlog = {
      title: '',
      author: 'Random author 4',
      url: 'Random url 4',
      likes: 543,
      userId: id
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `Bearer ${authorizedUser}`)
      .expect(400)

    const response = await api.get('/api/blogs')
    expect(response.body).toHaveLength(helper.initialBlogs.length) // length stays the same cuz the post without title shouldn't be added.
  })

  test('verify that blogs contain the id identifier, which we transformed from _id', async () => {
    const response = await api.get('/api/blogs')
    response.body.forEach(blog => expect(blog.id).toBeDefined())
  })

  test('if the likes property is missing from a new blog request, create it and default it to 0', async () => {
    const user = await User.find({ username: 'testingusername1' })
    const id = user._id

    const authorizedUser = await helper.loginUser('testingusername1', 'testingpassword1')

    const blogWithoutLike = {
      title: 'Random Blog 1',
      author: 'Random author 1',
      url: 'Random url 1',
      userId: id
    }

    const response = await api.post('/api/blogs').send(blogWithoutLike).set('Authorization', `Bearer ${authorizedUser}`)
    expect(response.body.likes).toBeDefined()

  })
})

describe('Validation for username and password', () => {
  test('Ensuring invalid user cant be added to DB', async () => {
    const newTestBadUserUsername = {
      username: 'es',
      name: 'Jackson',
      password: 'testing123'
    }

    const registerUser = await api.post('/api/users').send(newTestBadUserUsername)
    expect(registerUser.status).toBe(400)
  })

  test('Ensuring invalid password cant be added to DB', async () => {
    const newTestBadUserPassword = {
      username: 'esbhghgh',
      name: 'Jackson',
      password: 'te'
    }

    const registerUser = await api.post('/api/users').send(newTestBadUserPassword)
    expect(registerUser.status).toBe(400)
  })

})

describe('Testing protected routes', () => {
  test('Test user is authorized and can post a blog', async () => {
    const user = await User.find({ username: 'testingusername1' })
    const id = user._id

    const authorizedUser = await helper.loginUser('testingusername1', 'testingpassword1')

    const testBlog = {
      title: "Random Blog 5",
      author: "Random author 5",
      url: "Random url 5",
      likes: 775,
      userId: id
    }
    // send a request to post a new blog as logged in test user, while also setting our request header 'authorization' to contain our 'Bearer <tokenstring>'.
    const request = await api.post('/api/blogs').send(testBlog).set('Authorization', `Bearer ${authorizedUser}`)
    expect(request.status).toBe(201)
  })
})

// jest function which runs after every single test above is finished, and closes our connection to the db.
afterAll(async () => {
  console.log('running afterAll closing function')
  await mongoose.connection.close()
})