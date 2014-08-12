'use strict';
var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('selenium-chromedriver');

module.exports = function() {
  before(function() {
    chrome.setDefaultService(
      new chrome.ServiceBuilder(chromeDriver.path).build()
    );

    this.driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();
  });
};
