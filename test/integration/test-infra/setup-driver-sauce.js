'use strict';
var request = require('https').request;

var webdriver = require('selenium-webdriver');
var Tunnel = require("sauce-tunnel");
var Promise = require('bluebird');

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
 * Annotate job with test status via Sauce Lab's REST API:
 * https://docs.saucelabs.com/reference/test-configuration/#job-annotation-with-the-rest-api
 *
 * @param {String} name The Sauce Labs account name to use to create the
 *                      tunnel.
 * @param {String} key The Sauce Labs account key to use to create the tunnel.
 * @param {String} jobId The Sauce Labs job identifier.
 * @param {Array} report Test status data. Each element should be an object
 *                       that defines (at a minimum) a `passed` attribute.
 *
 * @returns {Promise} An eventual value that will resolve when the request has
 *                    completed.
 */
function annotateJob(name, key, jobId, report) {
  var body = JSON.stringify({
    passed: report.every(function(test) { return test.passed; }),
    // Sauce Labs does not handle Array values for the `custom-data` attribute,
    // so the report should be wrapped in an Object.
    'custom-data': { report: report }
  });
  var options = {
    hostname: 'saucelabs.com',
    path: '/rest/v1/' + name + '/jobs/' + jobId,
    method: 'PUT',
    auth: name + ':' + key,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length
    }
  };

  return new Promise(function(resolve, reject) {
    var req = request(options, function(res) {
      var data = '';

      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {
        if (res.statusCode !== 200) {
          reject(data);
        } else {
          resolve();
        }
      });
    });

    req.on('error', reject);

    req.write(body);
    req.end();
  });
}

/**
 * @param {String} name The Sauce Labs account name to use to run the tests.
 * @param {String} key The Sauce Labs account key to use to run the tests.
 * @param {Object} browser Description of browser to use
 * @param {String} browser.name
 * @param {String} [browser.version]
 * @param {String} [tunnelId] The identifier of the currently-active tunnel to
 *                            Sauce Labs, if any. When unspecified, a tunnel
 *                            will be created prior to running the tests.
 */
module.exports = function(name, key, browser, tunnelId, buildId) {
  var report = [];
  var capabilities;

  if (!tunnelId) {
    tunnelId = setupSauceTunnel(name, key);
  }

  capabilities = {
    browserName: browser.name,
    username: name,
    accessKey: key,
    'tunnel-identifier': tunnelId
  };

  if (browser.version) {
    capabilities.version = browser.version;
  }

  if (buildId) {
    capabilities.build = buildId;
  }

  before(function() {
    this.driver = new webdriver.Builder()
      .usingServer('http://ondemand.saucelabs.com:80/wd/hub')
      .withCapabilities(capabilities)
      .build();
  });

  afterEach(function() {
    var test = this.currentTest;

    report.push({
      title: test.title,
      passed: test.state === 'passed'
    });
  });

  after(function() {
    this.timeout(30 * 1000);

    return this.driver.getSession()
      .then(function(session) {
        return annotateJob(name, key, session.getId(), report);
      });
  });
};
