/**
 * Primary file for the API
 */


// Dependencies
const server = require('./lib/server')
// const Workers = require('./lib/workers')


// Declare the app
const app = {}

// Init function
app.init = () => {
  // Start the server
  server.init()
  // Start the workers
  // Workers.init()
}

// Execute
app.init()

// Export the app
module.exports = app