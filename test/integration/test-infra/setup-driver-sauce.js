'use strict';
var webdriver = require('selenium-webdriver');
var Tunnel = require("sauce-tunnel");

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
function setupSauceTunnel(name, key) {
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
    this.timeout(61 * 1000);
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
module.exports = function(name, key, tunnelId, buildId) {
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
};
