const https = require('https')

class Stripe {
  static makeRequest (payload, path, method, callback) {
    // Stringify the payload
    // Not the same as a JSON stringify - this is a URL stringify
    const stringPayload = querystring.stringify(payload)
    // Configure the request details
    const requestDetails = {
      protocol: 'https:',
      hostname: Stripe.hostname,
      method: method,
      path: `${Stripe.apiBase}${path}`,
      auth: `${Stripe.testKey}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    }
    // Instantiate the request object
    const req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      const status = res.statusCode
      // Callback successfully if the request went through
      if (status === 200 || status === 201) {
        callback(false)
      } else {
        callback(`Status code returned was: ${status}`)
      }
    })

    // Bind to the erro event so it doesn't get thrown
    req.on('error', (e) => {
      callback(e)
    })

    // Add the payload
    req.write(stringPayload)

    // End the request | same as sending the request
    req.end()
  }

  static authenticate () {

  }

  /**
   * Stripe -- POST
   * Required Data: amount
   * Optional Data: none
   * @param {Number} amount total amount to charge
   */
  static post (data, callback) {
    const currency = 'USD'
    amount = amount * 100 // Stripe wants currency amount in cents
    Stripe.makeRequest({amount, currency}, '/charges', 'POST', callback)
  }
}

Stripe.hostname = 'api.stripe.com'
Stripe.apiBase = '/v1'
Stripe.testKey = 'pk_test_xDUVCQDXEoEsiymidrkkz5Jt'