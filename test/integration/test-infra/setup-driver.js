'use strict';

module.exports = function() {
  var env = process.env;
  var sauceName = env.SAUCE_USERNAME;
  var sauceKey = env.SAUCE_ACCESS_KEY;
  var buildId = env.TRAVIS_BUILD_NUMBER;
  var tunnelId = env.TRAVIS_JOB_NUMBER;
  var driver, server;

  if (sauceName && sauceKey) {
    require('./setup-driver-sauce')(sauceName, sauceKey, tunnelId, buildId);
  } else {
    require('./setup-driver-local')();
  }

  before(function() {
    return require('./server')(8031).then(function(_server) {
      server = _server;
    });
  });

  beforeEach(function() {
    // Create a local reference to the driver instance for use in cleanup in
    // case the context reference is mistakenly destroyed during testing.
    driver = this.driver;
  });

  afterEach(function() {
    return driver.quit();
  });
};
