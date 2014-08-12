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

/**
 * Set up a secure tunnel to Sauce Labs. This is done automatically in the CI
 * environment [1] so that multiple test runs can share the same tunnel
 * connection.
 *
 * [1] http://docs.travis-ci.com/user/sauce-connect/
 *
 * @param {String} name The Sauce Labs account name to use to create the
 *                      tunnel.
 * @param {String} key The Sauce Labs account key to use to create the tunnel.
 *
 * @returns {String} Identifier for the tunnel connection.
 */
function setupSetupSauceTunnel(name, key) {
  var tunnelId = 'tunnel-' + (new Date()).getTime();
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

  after(function(done) {
    // TODO: Annotate job with test status via Sauce Lab's REST API:
    // https://docs.saucelabs.com/reference/test-configuration/#job-annotation-with-the-rest-api
    this.timeout(60 * 1000);
    tunnel.stop(done);
  });

  return tunnelId;
}

/**
 * @param {String} name The Sauce Labs account name to use to run the tests.
 * @param {String} key The Sauce Labs account key to use to run the tests.
 * @param {String} [tunnelId] The identifier of the currently-active tunnel to
 *                            Sauce Labs, if any. When unspecified, a tunnel
 *                            will be created prior to running the tests.
 */
function setupSauceDriver(name, key, tunnelId, buildId) {
  var Tunnel = require("sauce-tunnel");
  var capabilities = {};

  if (!tunnelId) {
    tunnelId = setupSauceTunnel(name, key);
  }

  capabilities = {
    browserName: 'googlechrome',
    platform: 'Windows 2012',
    username: name,
    accessKey: key,
    'tunnel-identifier': tunnelId
  };

  if (buildId) {
    capabilities.build = buildId;
  }

  beforeEach(function() {
    this.driver = new webdriver.Builder()
      .usingServer('http://ondemand.saucelabs.com:80/wd/hub')
      .withCapabilities(capabilities)
      .build();
  });

  after(function(done) {
    // TODO: Annotate job with test status via Sauce Lab's REST API:
    // https://docs.saucelabs.com/reference/test-configuration/#job-annotation-with-the-rest-api
  });
}

module.exports = function() {
  var env = process.env;
  var sauceName = env.SAUCE_USERNAME;
  var sauceKey = env.SAUCE_ACCESS_KEY;
  var buildId = env.TRAVIS_BUILD_NUMBER;
  var tunnelId = env.TRAVIS_JOB_NUMBER;
  var driver, server;

  if (sauceName && sauceKey) {
    setupSauceDriver(sauceName, sauceKey, tunnelId, buildId);
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
