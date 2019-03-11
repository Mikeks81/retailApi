const Data = require('../lib/data')
const menuitems = require('../.data/menuitems/menuitems')

class MenuItems {
  /**
   * Utility function to find menuitem objects by itemName
   * @param {String} itemName 
   */
  static getMenuItemsbyItemName (itemName) {
    return menuitems.filter(item => item.itemName === itemName)
  }

  /**
   * GET
   * @return {Array} all menuitem objects
   */
  static get (data, callback) {
    callback(200, menuitems)
  }
}

module.exports = MenuItems