/**
 * All methods for persisting user data
 */

// Dependencies
const Data = require('../lib/data')
const Helpers = require('../lib/helpers')
const Token = require('./Token')

class User {

  static validateEmail (email) {
    return User.validateString(email) && Helpers.validateEmail(email.trim())
  }

  static validateString (string) {
    return User.validateString(string)
  }
  // Users - POST
  // Required data: firstName, lastName, email, streetAddress
  // Optional data: none
  static post(data, callback) {
    // Check that all required fields are type correct and filled out
    let { firstName, lastName, email, streetAddress, password } = data.payload

    // Validation of data
    firstName = User.validateString(firstName) ? firstName.trim() : false
    lastName = User.validateString(lastName) ? lastName.trim() : false
    streetAddress = User.validateString(streetAddress) ? streetAddress.trim() : false
    email = User.validateEmail(email) ? email.trim() : false
    password = User.validateString(password) ? password.trim() : false

    if (firstName && lastName && email && password && streetAddress) {
      // Make sure that the User doesn't already exist
      Data.read('users', email, (err, data) => {
        if (err) {
          // if err - we haven't a matching entry we'll create one
          // Hash the password
          const hashedPassword = Helpers.hash(password)

          if (hashedPassword) {
            // Create the user object
            const userObject = {
              firstName,
              lastName,
              email,
              password: hashedPassword,
              streetAddress
            }

            Data.create('users', email, userObject, (err) => {
              if (!err) {
                callback(200)
              } else {
                console.log(err)
                callback(500, { Error: 'Could not create the new user.' })
              }
            })
          } else {
            callback(500, { Error: 'Cold not hash the user\'s password' })
          }
        } else {
          callback(400, { Error: 'A user with that email number already exists.' })
        }
      })
    } else {
      callback(400, { Error: 'Missing required fields' })
    }
  }
  // Users - GET
  // Required data: email, token
  // Optional data; none
  static get(data, callback) {
    // Check that the email number is valid
    let { email } = data.queryStringObject
    email = User.validateEmail(email) ? email.trim() : false

    if (email) {
      // Get the token from the headers
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
      // Verify the given token is valid for the email number.
      Token.verfiyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
          // Lookup the user.
          Data.read('users', email, (err, data) => {
            if (!err && data) {
              // Remove the has password from the user object before returning it to the request object
              const _data = { ...data }
              const { password, ...rest } = _data
              callback(200, rest)
            } else {
              callback(404)
            }
          })
        } else {
          callback(403, { Error: 'Missing token in header or token is invalid.' })
        }
      })
    } else {
      callback(400, { Error: 'Missing required fields' })
    }
  }

  // Users - PUT
  // Required data: email
  // Optional data: firstName, lastName, password or streetAddress (at least one must be specified, to update)
  static put(data, callback) {
    // Check for the required field
    let { firstName, lastName, email, password, streetAddress } = data.payload
    email = User.validateEmail(email) ? email.trim() : false

    // Check for the optional fields
    firstName = User.validateString(firstName) ? firstName.trim() : false
    lastName = User.validateString(lastName) ? lastName.trim() : false
    password = User.validateString(password) ? password.trim() : false
    streetAddress = User.validateString(streetAddress) ? streetAddress.trim() : false

    // Error if the email is invalid
    if (email) {
      if (firstName || lastName || password) {
        // Get the token from the headers
        const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
        // Verify the given token is valid for the email number.
        Token.verfiyToken(token, email, (tokenIsValid) => {
          if (tokenIsValid) {
            // Lookup the user
            Data.read('users', email, (err, userData) => {
              if (!err && userData) {
                // Update the fields necessary
                if (firstName) {
                  userData.firstName = firstName
                }
                if (lastName) {
                  userData.lastName = lastName
                }
                if (password) {
                  userData.password = Helpers.hash(password)
                }

                // Store the new updates
                Data.update('users', email, userData, err => {
                  if (!err) {
                    callback(200)
                  } else {
                    console.log(err)
                    callback(500, { Error: 'Could not update the user' })
                  }
                })
              } else {
                callback(400, { Error: 'The spcified User does not exists.' })
              }
            })
          } else {
            callback(403, { Error: 'Missing token in header or token is invalid.' })
          }
        })
      } else {
        callback(400, { Error: 'Missing required fields' })
      }
    } else {
      callback(400, { Error: 'Missing required email field or is invalid' })
    }
  }

  // User - DELETE
  // Required field: email
  static delete(data, callback) {
    // Check that the email number is valid
    let { email } = data.queryStringObject
    email = User.validateEmail(email) ? email.trim() : false

    if (email) {
      // Get the token from the headers
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
      // Verify the given token is valid for the email number.
      Token.verfiyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
          Data.read('users', email, (err, userData) => {
            if (!err && userData) {
              Data.delete('users', email, err => {
                if (!err) {
                  // Delete each of the checks associated with the user
                  const userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : []
                  const checksToDelete = userChecks.length
                  if (checksToDelete > 0) {
                    let checksDeleted = 0
                    let deletionsErrors = false
                    // Loop through the checks
                    userChecks.forEach((checkId) => {
                      // Delete the check
                      Data.delete('checks', checkId, (err) => {
                        if (err) {
                          deletionsErrors = true
                        }
                        checksDeleted++
                        if (checksDeleted === checksToDelete) {
                          if (!deletionsErrors) {
                            callback(200)
                          } else {
                            callback(500, { Error: 'Errors encountered while attempting to delete all of the user\'s checks. All checks may have not been deleted from the system successfully.' })
                          }
                        }
                      })
                    })
                  } else {
                    callback(200)
                  }

                } else {
                  callback(500, { Error: 'Could not delete the specified user' })
                }
              })
            } else {
              callback(400, { Error: 'Could not find the specified user' })
            }
          })
        } else {
          callback(403, { Error: 'Missing token in header or token is invalid.' })
        }
      })
    } else {
      callback(400, { Error: 'Missing required email field or is invalid' })
    }
  }
}

module.exports = User