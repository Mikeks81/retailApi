/**
 * All methods for persisting user data
 */

// Dependencies
const Data = require('../lib/data')
const Helpers = require('../lib/helpers')

class User {
  // Users - POST
  // Required data: firstName, lastName, phone, password, tosAgreement
  // Optional data: none
  static post(data, callback) {
    // Check that all required fields are type correct and filled out
    let { firstName, lastName, phone, password, tosAgreement } = data.payload
    firstName = typeof (firstName) === 'string' && firstName.trim().length > 0 ? firstName.trim() : false
    lastName = typeof (lastName) === 'string' && lastName.trim().length > 0 ? lastName.trim() : false
    phone = typeof (phone) === 'string' && phone.trim().length === 10 ? phone.trim() : false
    password = typeof (password) === 'string' && password.trim().length > 0 ? password.trim() : false
    tosAgreement = typeof (tosAgreement) === 'boolean' && tosAgreement === true || false

    if (firstName && lastName && phone && password && tosAgreement) {
      // Make sure that the User doesn't already exist
      Data.read('users', phone, (err, data) => {
        if (err) {
          // if err - we haven't a matching entry we'll create one
          // Hash the password
          const hashedPassword = Helpers.hash(password)

          if (hashedPassword) {
            // Create the user ovject
            const userObject = {
              firstName,
              lastName,
              phone,
              password: hashedPassword,
              tosAgreement
            }

            Data.create('users', phone, userObject, (err) => {
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
          callback(400, { Error: 'A user with that phone number already exists.' })
        }
      })
    } else {
      callback(400, { Error: 'Missing required fields' })
    }
  }
  // Users - GET
  // Required data: phone, token
  // Optional data; none
  static get(data, callback) {
    // Check that the phone number is valid
    let { phone } = data.queryStringObject
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false

    if (phone) {
      // Get the token from the headers
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
      // Verify the given token is valid for the phone number.
      _Tokens.verfiyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
          // Lookup the user.
          Data.read('users', phone, (err, data) => {
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
  // Required data: phone
  // Optional data: firstName, lastName, password (at least one must be specified)
  static put(data, callback) {
    // Check for the required field
    let { firstName, lastName, phone, password } = data.payload
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false

    // Check for the optional fields
    firstName = typeof (firstName) === 'string' && firstName.trim().length > 0 ? firstName.trim() : false
    lastName = typeof (lastName) === 'string' && lastName.trim().length > 0 ? lastName.trim() : false
    password = typeof (password) === 'string' && password.trim().length > 0 ? password.trim() : false

    // Error if the phone is invalid
    if (phone) {
      if (firstName || lastName || password) {
        // Get the token from the headers
        const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
        // Verify the given token is valid for the phone number.
        _Tokens.verfiyToken(token, phone, (tokenIsValid) => {
          if (tokenIsValid) {
            // Lookup the user
            Data.read('users', phone, (err, userData) => {
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
                Data.update('users', phone, userData, err => {
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
      callback(400, { Error: 'Missing required field' })
    }
  }

  // User - DELETE
  // Required field: phone
  static delete(data, callback) {
    // Check that the phone number is valid
    let { phone } = data.queryStringObject
    phone = typeof phone === 'string' && phone.trim().length === 10 ? phone.trim() : false

    if (phone) {
      // Get the token from the headers
      const token = typeof (data.headers.token) === 'string' ? data.headers.token : false
      // Verify the given token is valid for the phone number.
      _Tokens.verfiyToken(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
          Data.read('users', phone, (err, userData) => {
            if (!err && userData) {
              Data.delete('users', phone, err => {
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
      callback(400, { Error: 'Missing required fields' })
    }
  }
}

module.exports = User