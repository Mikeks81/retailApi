const {User, Token, ShoppingCart, MenuItems} = require('../Models')

// Defiine our Request handlers
class RouteHandler {
  // Ping hander
  static ping (data, callback) {
    // callback a http status code and a payload object
    callback(200)
  }

  // Users hander
  static users (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if (acceptableMethods.indexOf(data.method) > -1) {
      User[data.method](data, callback)
    } else {
      callback(405)
    }
  }

  // Tokens hander
  static tokens (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if (acceptableMethods.indexOf(data.method) > -1) {
      Token[data.method](data, callback)
    } else {
      callback(405)
    }
  }

  // ShoppngCart handler
  static shoppingCart (data, callback) {
    const acceptableMethods = ['post', 'get', 'put', 'delete']
    if (acceptableMethods.indexOf(data.method) > -1) {
      ShoppingCart[data.method](data, callback)
    } else {
      callback(405)
    }
  }

  // Menuitem handler
  static menuitems (data, callback) {
    const acceptableMethods = ['get']
    if (acceptableMethods.indexOf(data.method) > -1) {
      MenuItems[data.method](data, callback)
    }
  }

  // NotFound hanlder
  static notFound(data, callback) {
    // callback a http status code and a payload object
    callback(404)
  }
}

module.exports = RouteHandler