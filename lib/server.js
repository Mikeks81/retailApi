/**
 * Server-related tasks
 */

// Dependencies
const http = require('http')
const https = require('https')
const config = require('./config')
const fs = require('fs')
const path = require('path')
const router = require('../routes/router')


// Instantiate the server module object
const server = {}

// instantiating the http Server
server.httpServer = http.createServer((req, res) => {
  router(req, res)
})

// getting the https key and cert
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
}

// Instatiate the HTTPS  server
server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  router(req, res)
})

// Init script
server.init = () => {
  // Start the HTTP server
  // start the server and have it start on port depending on NODE_ENV
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m', `The HTTP server is listening on port ${config.httpPort}`)

  })

  // Start the HTTPS server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log('\x1b[35m%s\x1b[0m', `The HTTPS server is listening on port ${config.httpsPort}`)
  })
}

// Export module
module.exports = server