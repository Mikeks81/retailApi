const Data = require('../lib/data')
const MenuItems = require('./MenuItems')
const Helpers = require('../lib/helpers')

class ShoppingCart {
  static _validateItemName (itemName) {
    return Helpers.validateString(itemName) && MenuItems.getMenuItemsbyItemName(itemName).length > 0
  }
  static list () {

  }

  /**
   * ShoppingCart - POST
   * Required data: itemName
   * Optional data: none
   */
  static post (data, callback) {
    let {itemName} = data.payload
    let {token} = data.headers
    // validation
    itemName = ShoppingCart._validateItemName(itemName) ? itemName : false
    token = Helpers.validateString(token) ? token : false

    if (itemName) {
      // Look up the user by reading the token
      Data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
          const { email } = tokenData

          // Lookup the user data
          Data.read('users', email, (err, userData) => {
            if (!err && userData && !userData.shoppingCartId) {

                const shoppingCartId = Helpers.createRandomString(20)
                const shoppingCartObject = {
                  email,
                  items: [itemName]
                }
                // Save the object
              Data.create('shoppingCarts', shoppingCartId, shoppingCartObject, (err) => {
                  if (!err) {
                    // add the check id to the user's object
                    userData.shoppingCartId = shoppingCartId

                    // Save the new user data
                    Data.update('users', email, userData, (err) => {
                      if (!err) {
                        // Return the data about the check
                        callback(200, shoppingCartObject)
                      } else {
                        callback(500, { Error: 'Could not update the user with the new shopping cart.' })
                      }
                    })

                  } else {
                    callback(500, { Error: 'Could not create the shopping cart.' })
                  }
                })
              } else {
                callback(400, { Error: 'The user already has an active shopping cart.' })
              }
          })
        } else {
          callback(403)
        }
      })
    } else {
      callback(400, {Error: 'Missing itemName or itemName is not valid.'})
    }
  }

  static put (data, callback) {

  }
  /**
   * ShoppingCart - GET
   * @param {object} data 
   * @param {function} callback 
   */
  static get (data, callback) {
    let { token } = data.headers
    console.log({token})
    token = Helpers.validateString(token) ? token : false
    if (token) {

      // Get the user by the token email. Look up token
      Data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
          const { email } = tokenData

          // Look up user by email in the token object
          Data.read('users', email, (err, userData) => {
            if (!err && userData && userData.shoppingCartId) {

              // Look up the users shopping cart.
              Data.read('shoppingCarts', userData.shoppingCartId, (err, shoppingCartData) => {
                
                if (!err && shoppingCartData) {
                  callback(200, shoppingCartData)
                } else {
                  callback(500, 'Could not locate the shopping cart.')
                }
              })
            } else {
              callback(400, 'Missing a shopping cart, a shopping cart must be created first.')
            }
          })
        } else {
          callback(403)
        }
      })
    } else {
      callback(400, 'Missing validation token or is invalid.')
    }
  }
  static delete (data, callback) {

  }
}

module.exports = ShoppingCart