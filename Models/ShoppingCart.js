const Data = require('../lib/data')
const MenuItems = require('./MenuItems')
const Token = require('./Token')
const Helpers = require('../lib/helpers')

class ShoppingCart {
  static _validateItemName (itemName) {
    const typeofItemName = typeof (itemName) === 'string'
    let validation = false
    if (typeofItemName) {
      validation = Helpers.validateString(itemName) && MenuItems.getMenuItemsbyItemName(itemName).length > 0
    } else if (itemName instanceof Array) {
      validation = itemName.length > 0
    }
    return validation
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
    token = Helpers.validateTokenString(token) ? token : false

    if (itemName) {
      if (token) {
        // Look up the user by reading the token
        Data.read('tokens', token, (err, tokenData) => {
          if (!err && tokenData) {
            const { email } = tokenData
            if (tokenData.expires > Date.now()) {
              // Lookup the user data
              Data.read('users', email, (err, userData) => {
                if (!err && userData && !userData.shoppingCartId) {
    
                    const shoppingCartId = Helpers.createRandomString(20)
                    const shoppingCartObject = {
                      email,
                      items: itemName instanceof Array ? itemName : [itemName]
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
              callback(400, { Error: 'Token has expired'})
            }
          } else {
            callback(403)
          }
        })
      } else {
        callback(400, 'Token is invalid.')
      }
    } else {
      callback(400, {Error: 'Missing itemName or itemName is not valid.'})
    }
  }
  
  /**
   * ShoppingCart - PUT
   * Required data: itemName
   * Optional data: none 
   * @param {object} data 
   * @param {function} callback 
   */
  static put (data, callback) {
    let { itemName } = data.payload
    let { token } = data.headers
    itemName = ShoppingCart._validateItemName(itemName) ? itemName : false
    token = Helpers.validateTokenString(token) ? token : false
    if (itemName && token) {
      // Get the user by the token email. Look up token
      Data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
          const { email } = tokenData
          if (tokenData.expires > Date.now()) {
            // Look up user by email in the token object
            Data.read('users', email, (err, userData) => {
              const { shoppingCartId } = userData
              if (!err && userData && shoppingCartId) {
  
                // Look up the users shopping cart.
                Data.read('shoppingCarts', shoppingCartId, (err, shoppingCartData) => {
                  if (!err && shoppingCartData) {
                    const {email} = shoppingCartData
                    // new Set + spread operator is reducing the array to unique values only
                    const shoppingCartObject = {
                      email,
                      items: itemName instanceof Array ? itemName : [itemName]
                    }
                    console.log({shoppingCartObject});
                    // Update the shopping cart
                    Data.update('shoppingCarts', userData.shoppingCartId, shoppingCartObject, err => {
                      if (!err) {
                        callback(200, 'Succesfully updated the shoping cart')
                      } else {
                        callback(500, 'Error: Could not update shopping cart.')
                      }
                    })
                  } else {
                    callback(500, 'Could not locate the shopping cart.')
                  }
                })
              } else {
                callback(400, 'Missing a shopping cart, a shopping cart must be created first.')
              }
            })
          } else {
            callback(400, {Error: 'Token has expired.'})
          }
        } else {
          callback(403, 'Could not find token.')
        }
      })
    } else {
      callback(400, 'Validation of itemName or token has failed.')
    }
  }
  /**
   * ShoppingCart - GET
   * Required data: none
   * Optional data: none
   * @param {object} data 
   * @param {function} callback 
   */
  static get (data, callback) {
    let { token } = data.headers
    token = Helpers.validateString(token) ? token : false
    if (token) {

      // Get the user by the token email. Look up token
      Data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
          const { email, expires } = tokenData
          if (expires > Date.now()) {
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
            callback(400, {Error: 'Token has expiredd.'})
          }
        } else {
          callback(403)
        }
      })
    } else {
      callback(400, 'Missing validation token or is invalid.')
    }
  }

  /**
   * ShoppingCart - DELETE
   * Required data: none
   * Optional data: none
   * @param {object} data 
   * @param {function} callback 
   */
  static delete (data, callback) {
    let { token } = data.headers
    token = Helpers.validateString(token) ? token : false
    if (token) {

      // Get the user by the token email. Look up token
      Data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
          const { email, expires } = tokenData
          if (expires > Date.now()) {
            // Look up user by email in the token object
            Data.read('users', email, (err, userData) => {
              if (!err && userData && userData.shoppingCartId) {

                // Delete up the users shopping cart.
                Data.delete('shoppingCarts', userData.shoppingCartId, (err) => {
                  if (!err) {
                    const userObject = {
                      ...userData,
                      shoppingCartId: null
                    }
                    
                    // Remove the shopping cart id from the user
                    Data.update('users', email, userObject, err => {
                      if (!err) {
                        callback(200)
                      } else {
                        callback(500, {Error: 'Could not update the user.'})
                      }
                    })
                  } else {
                    callback(500, 'Could not locate the shopping cart to delete.')
                  }
                })
              } else {
                callback(400, 'Missing a shopping cart, a shopping cart must be created first.')
              }
            })
          } else {
            callback(400, { Error: 'Token has expiredd.' })
          }
        } else {
          callback(403)
        }
      })
    } else {
      callback(400, 'Missing validation token or is invalid.')
    }
  }
}

module.exports = ShoppingCart