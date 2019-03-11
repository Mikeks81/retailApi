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
          const userEmail = tokenData.email

          // Lookup the user data
          Data.read('users', userEmail, (err, userData) => {
            if (!err && userData && !userData.shoppingCartId) {

                const shoppingCartId = Helpers.createRandomString(20)
                const shoppingCartObject = {
                  userEmail,
                  items: [itemName]
                }
                // Save the object
              Data.create('shoppingCarts', shoppingCartId, shoppingCartObject, (err) => {
                  if (!err) {
                    // add the check id to the user's object
                    userData.shoppingCartId = shoppingCartId

                    // Save the new user data
                    Data.update('users', userEmail, userData, (err) => {
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
  static get (data, callback) {

  }
  static delete (data, callback) {

  }
}

module.exports = ShoppingCart