'use strict';

const Homey = require('homey');
const Https = require('https');
const Axios = require("axios");

class DirigeraApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('DirigeraApp has been initialized');
  }
}

module.exports = DirigeraApp;
