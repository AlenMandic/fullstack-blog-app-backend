# Back-end repository / web service for my blog sharing social media website using NodeJS/Express, MongoDB & Mongoose / Fly.io

# Link to deployed site: https://blog-list-app-backend.fly.dev

- Express back-end for a blog sharing mini social media site. The project follows best practices regarding folder structure and uses `REST-ful` API standards for serving data.

# Testing

- Integration testing was implemented using `JEST` and the `Supertest` package.
- Tests can be found in `/tests/blog.test.js` alongside the helper test functions which allow us to test our application in almost any way we want.
- Basic API testing was also done using `Postman`
- Linting was setup using `ESlint`

# Controllers
- Contains all of our relevant routes and resources

# Models
- Contains the shape and full validation of our Mongoose objects ( User and Blog )

# Utils
- Contains a lot of our logic and utility functions/middlewares. 
- `config.js` sets up all of our enviroment variables, ports, and secrets from our `.env` file
- `logger.js` contains a more concise way of displaying informational or error messages throughout our app.
- `rateLimitMiddleware.js` contains a rate limiter for our app using the `express-rate-limit` package. Currently it is setup as a global route limiter, ensuring our application can't be infinitely spammed/brute-forced with requests.

# /Utils/middleware.js
- `middleware.js` contains most of our important middlewares, such as a `requestLogger` which displays basic information for every incoming request.
- `getTokenFrom` which is a function used to resolve token in requests
- `userExtractorMiddleware` which runs on our protected / authenticated routes, and finds out which `User` is making the request.
- `unknownEndpoint` which handles unknown endpoint requests.
- `errorHandler` which is the first error-handler in our app, handles our potential errors by the `error.name` property

# app.js
- handles the biggest part of our app logic, establishes a connection to our database, and handles middleware ordering.

# index.js
- Starts the express application using `app.listen`, and listens for requests on our designated `PORT`

# User authentication / App security
- When a user is creating an account, a strong minimum 15 character password with atleast: 1 capital letter, 1 number and 1 special character is enforced.
- All of our inputs/forms are sanitized/validated both on the front-end repository, and this one, using `mongoose` and the `mongoose-unique-validator` package
- Passwords are hashed and salted/encrypted using the `bycrypt` package.
- When a user attempts to log in, we first make sure the password is correct using `bcrypt.compare` function. If the credentials are good, the user will receive back a JSON web token which has a 1 hour expiry date, and contains his username and id. The front-end will then be able to work with the authenticated user and his information.
- Each token is signed/checked against our secret variable.

- When working with JSON web tokens XSS attacks(cross-site-scripting, malicious script injections) are always a cause for concern. In order to best secure my application and prevent those attacks, our app uses the 'helmet` package which is recommended by Express to mitigate some well-known web vulnerabilities by setting HTTP headers appropriately, including  cross-site scripting attacks.
