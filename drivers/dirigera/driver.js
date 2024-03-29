'use strict';

const { Driver } = require('homey');
const Https = require('https');
const Axios = require("axios");
const AuthCode = require('./authcode.js');

class DirigeraDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('DirigeraDriver has been initialized');

    this.code = '';
    this.codeVerifier = "";
    this.codeChallenge = "";
  }

  async onPair(session) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    let selectedDevice;
    let driver = this;

    const devices = Object.values(discoveryResults).map(discoveryResult => {
      return {
        name: discoveryResult.txt.hostname,
        data: {
          id: discoveryResult.id,
        },
        store: {
          ipaddress: discoveryResult.address,
        }
      }
    });

    session.setHandler('list_devices', function() {
      driver.log("Pair: Returning " + devices.length + " devices");
      return devices;
    })

    session.setHandler('list_devices_selection', async (data) => {
      driver.log("Pair: Device id " + data[0].data.id + " selected");
      selectedDevice = data[0];
      driver.log("Device object:", selectedDevice);
      return selectedDevice;
    });

    session.setHandler('showView', async function (viewId) {
      driver.log("Showing view: " + viewId);

      if(viewId === 'authenticate_result') {
        session.emit("create_device", selectedDevice);
      }

      if(viewId === 'connecting') {
        driver.log("Generating CodeVerifier and CodeChallenge");
        driver.codeVerifier = AuthCode.generateCodeVerifier();
        driver.codeChallenge = AuthCode.calculateCodeChallenge(driver.codeVerifier);

        driver.log("Ver: " + driver.codeVerifier);
        driver.log("Challange: " + driver.codeChallenge);


        let dirigeraBaseURL = "https://" + selectedDevice.store.ipaddress + ":8443/v1";
        driver.log("Trying to connect to dirigera hub at " + dirigeraBaseURL);

        const axiosInstance = Axios.create({
          baseURL: dirigeraBaseURL,
          timeout: 3000,
          responseType: 'json',
          httpsAgent: new Https.Agent({rejectUnauthorized: false})
        });

        axiosInstance.get('/oauth/authorize', {
          params: {
            audience: 'homesmart.local',
            response_type: 'code',
            code_challenge: driver.codeChallenge,
            code_challenge_method: 'S256'
          }
        })
        .then(function(response) {
          driver.log("status: " + response.statusText);
          driver.log(response.data);
          driver.code = response.data.code;

          session.nextView();
        })
        .catch(function(error) {
          if (error.response) {
            driver.log("Axios Error: The request was made and the server responded with a status code that falls out of the range of 2xx");
            driver.log("Data: " + error.response.data);
            driver.log("Status: " + error.response.status);
            driver.log("Headers: " + error.response.headers);
          } else if (error.request) {
            driver.log("Axios Error: The request was made but no response was received");
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            driver.log("Request: " + error.request);
          } else {
            driver.log("Axios Error: Something happened in setting up the request that triggered an Error");
            driver.log('Error: ' + error.message);
          }
          driver.log("Config: " + error.config);
        })
      }
    })

    session.setHandler('getToken', async function (viewId) {
      driver.log("Trying to fetch token");

      const axiosInstance = Axios.create({
        baseURL: "https://" + selectedDevice.store.ipaddress + ":8443/v1",
        timeout: 3000,
        responseType: 'json',
        httpsAgent: new Https.Agent({rejectUnauthorized: false})
      });

      axiosInstance.post('/oauth/token',
      {
        code: driver.code,
        name: 'homey',
        grant_type: 'authorization_code',
        code_verifier: driver.codeVerifier
      })
      .then(function(response) {
        session.emit("auth_ok");
        driver.log("status: " + response.statusText);
        driver.log(response.data);
        selectedDevice.data.access_token = response.data.access_token;
        session.nextView();
      })
      .catch(function(error) {
        if (error.response) {
          driver.log("Axios Error: The request was made and the server responded with a status code that falls out of the range of 2xx");
          driver.log("Data: " + error.response.data);
          driver.log("Status: " + error.response.status);
          driver.log("Headers: " + error.response.headers);
        } else if (error.request) {
          driver.log("Axios Error: The request was made but no response was received");
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          driver.log("Request: " + error.request);
        } else {
          driver.log("Axios Error: Something happened in setting up the request that triggered an Error");
          driver.log('Error: ' + error.message);
        }
        driver.log("Config: " + error.config);
      })
    })
  }

}

module.exports = DirigeraDriver;
