const RouteHandler = require('../lib/routeHandler.js')
// Define a request router
const routes = {
  ping: RouteHandler.ping,
  users: RouteHandler.users,
  tokens: RouteHandler.tokens,
  // checks: Handlers.checks
}

module.exports = routes