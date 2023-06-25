'use strict';

const { Device } = require('homey');
const Dirigera = require("dirigera");

class DirigeraDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('DirigeraDevice has been initialized');
    let data = this.getData();
    this.log('Token: ' + data.access_token);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('DirigeraDevice has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('DirigeraDevice settings where changed');

    this.dirigeraClient = 0;
    this.ipaddress = "";
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('DirigeraDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('DirigeraDevice has been deleted');
  }


  onDiscoveryResult(discoveryResult) {
    this.log("onDiscoveryResult() called");

    // Return a truthy value here if the discovery result matches your device.
    return discoveryResult.id === this.getData().id;
  }

  async onDiscoveryAvailable(discoveryResult) {
    // This method will be executed once when the device has been found (onDiscoveryResult returned true)
    this.log("onDiscoveryAvailable() called");

    if( discoveryResult.address !== this.ipaddress ) {
      this.ipaddress = discoveryResult.address;
      this.log("IP address of device is " + this.ipaddress);

      this.dirigeraClient = await Dirigera.createDirigeraClient({
        gatewayIp: this.ipaddress,
        accessToken: this.getData().access_token
      });

      let devices = await this.dirigeraClient.devices.list();
      this.log("Devices ", devices);
      let d = this;
      this.dirigeraClient.startListeningForUpdates(async (updateEvent) => {
        d.log("Event: ", updateEvent);
      })
    }
  }

  onDiscoveryAddressChanged(discoveryResult) {
    this.log("onDiscoveryAddressChanged() called");
    // Update your connection details here, reconnect when the device is offline
    //this.api.address = discoveryResult.address;
    //this.api.reconnect().catch(this.error);
  }

  onDiscoveryLastSeenChanged(discoveryResult) {
    this.log("onDiscoveryLastSeenChanged() called");
    // When the device is offline, try to reconnect here
    //this.api.reconnect().catch(this.error);
  }


}

module.exports = DirigeraDevice;
