'use strict';
var webdriver = require('selenium-webdriver');

function setupChromeDriver() {
  var chrome = require('selenium-webdriver/chrome');
  var chromeDriver = require('selenium-chromedriver');

  before(function() {
    chrome.setDefaultService(
      new chrome.ServiceBuilder(chromeDriver.path).build()
    );
  });

  beforeEach(function() {
    this.driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();
  });
}

function setupSauceDriver(name, key, tunnelId) {
  var Tunnel = require("sauce-tunnel");
  var tunnel;

  before(function(done) {
    this.timeout(60 * 1000);
    tunnel = new Tunnel(name, key, tunnelId, true);


    tunnel.start(function(status) {
      if (status !== true) {
        done(new Error('Unable to initiate a secure tunnel to Sauce Labs'));
        return;
      }
      done();
    });
  });

  beforeEach(function() {
    this.driver = new webdriver.Builder()
      .usingServer('http://ondemand.saucelabs.com:80/wd/hub')
      .withCapabilities({
        browserName: 'googlechrome',
        platform: 'Windows 2012',
        username: name,
        accessKey: key,
        'tunnel-identifier': tunnelId
      })
      .build();
  });

  after(function(done) {
    // TODO: Annotate job with test status via Sauce Lab's REST API:
    // https://docs.saucelabs.com/reference/test-configuration/#job-annotation-with-the-rest-api
    this.timeout(60 * 1000);
    tunnel.stop(done);
  });
}

module.exports = function() {
  var env = process.env;
  var sauceName = env.SAUCE_USERNAME;
  var sauceKey = env.SAUCE_ACCESS_KEY;
  var tunnelId = env.SAUCE_TUNNEL_ID;
  var driver, server;

  if (sauceName && sauceKey && tunnelId) {
    setupSauceDriver(sauceName, sauceKey, tunnelId);
  } else {
    setupChromeDriver();
  }

  beforeEach(function() {
    // Create a local reference to the driver instance for use in cleanup in
    // case the context reference is mistakenly destroyed during testing.
    driver = this.driver;

    return require('./server')(8031).then(function(_server) {
      server = _server;
    });
  });

  afterEach(function() {
    return driver.quit();
  });
};
