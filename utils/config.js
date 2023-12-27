require('dotenv').config()

const PORT = process.env.PORT || 3003

const MONGODB_URL = process.env.NODE_ENV === 'TEST' ?
  process.env.TESTING_URL : process.env.MONGODB_URL

module.exports = { PORT, MONGODB_URL }