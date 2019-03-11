/**
 * All methods for persisting token data
 */

const Data = require('../lib/data')
const Helpers = require('../lib/helpers')

// Class for all token requests
class Token {
  // Token id validation
  static _validateId (id) {
    return typeof id === 'string' && id.trim().length === 20
  } 

  // Token extend validation
  static _validateExtend (extend) {
    return typeof extend === 'boolean' && extend
  }

  // Tokens - POST
  // Required data: email, password
  // Optional data: none
  static post(data, callback) {
    let { email, password } = data.payload
    email = Helpers.validateString(email) && Helpers.validateEmail(email.trim()) ? email.trim() : false
    password = Helpers.validateString(password) ? password.trim() : false
    if (email && password) {
      // Lookup user who matches that email number 
      Data.read('users', email, (err, userData) => {
        if (!err && userData) {
          // Hash the sent password and compare it to the hashed password stored in the user object.
          const hashedPassword = Helpers.hash(password)
          if (hashedPassword === userData.password) {
            // if valid, create a new token with a random name. Set expiration date 1 hour into the future.
            const tokenId = Helpers.createRandomString(20)
            /**
             * Expire token one hour from now.
             * 1000ms in 1 second,
             * 60 seconds in a minute,
             * 60 minutes in an hour
             */
            const expires = Date.now() + 1000 * 60 * 60
            const tokenObject = { email, id: tokenId, expires }
            // Store the token
            Data.create('tokens', tokenId, tokenObject, err => {
              if (!err) {
                callback(200, tokenObject)
              } else {
                callback(500, { Error: 'Could not create a new token.' })
              }
            })
          } else {
            callback(400, { Error: 'Password did not match the specified user\'s stored password.' })
          }
        } else {
          callback(400, { Error: 'Could not find the specified user.' })
        }
      })
    } else {
      callback(400, { Error: 'Missing required field(s)' })
    }
  }
  // Tokens - GET
  // Required Data: id
  // Optional data: none
  static get(data, callback) {
    // Check that the id is valid
    let { id } = data.queryStringObject
    id = Token._validateId(id) ? id.trim() : false

    if (id) {
      // Lookup the token
      Data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
          callback(200, tokenData)
        } else {
          callback(404)
        }
      })
    } else {
      callback(400, { Error: 'Missing required fields' })
    }
  }
  // Tokens - PUT
  // Require data: id, extend
  // Optional data: none
  static put(data, callback) {
    // Check for the required field
    let { id, extend } = data.payload
    id = Token._validateId(id) ? id.trim() : false
    extend = Token._validateExtend(extend)

    if (id && extend) {
      // Look up the token
      Data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
          // Check to make sure the toke isn't already expired.
          if (tokenData.expires > Date.now()) {
            // Set the expiration an hour from now
            tokenData.expires = Date.now() + 1000 * 60 * 60

            // Store the updates
            Data.update('tokens', id, tokenData, (err) => {
              if (!err) {
                callback(200)
              } else {
                callback(500, { Error: 'Could not update the token expiration.' })
              }
            })
          } else {
            callback(400, { Error: 'The token has expired and can not be extended.' })
          }
        } else {
          callback(400, { Error: 'Specified token does not exist.' })
        }
      })
    } else {
      callback(400, { Error: 'Missing required fields or fields are invalid.' })
    }
  }
  // Tokens - DELETE
  // Required data: id
  // Optional data: none
  static delete(data, callback) {
    // Check that the email number is valid
    let { id } = data.queryStringObject
    id = Token._validateId(id) ? id.trim() : false
    // Lookup the token
    if (id) {
      Data.read('tokens', id, (err, data) => {
        if (!err && data) {
          Data.delete('tokens', id, err => {
            if (!err) {
              callback(200)
            } else {
              callback(500, { Error: 'Could not delete the specified token' })
            }
          })
        } else {
          callback(400, { Error: 'Could not find the specified token' })
        }
      })
    } else {
      callback(400, { Error: 'Missing required fields' })
    }
  }

  // Verify if a given token is currently valid for a given user.
  static verfiyToken(id, email, callback) {
    // Look up the token
    Data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check that the token is for the given user and has not expired
        if (tokenData.email === email && tokenData.expires > Date.now()) {
          callback(true)
        } else {
          callback(false)
        }
      } else {
        callback(false)
      }
    })
  }
}

module.exports = Token