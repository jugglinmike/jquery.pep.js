'use strict';
var assert = require('assert');
var path = require('path');

var webdriver = require('selenium-webdriver');
var chrome = require('selenium-webdriver/chrome');
var chromeDriver = require('selenium-chromedriver');

var setupPep = require('./setup-pep');

describe('stuff', function() {
  var driver;

  before(function() {
    chrome.setDefaultService(
      new chrome.ServiceBuilder(chromeDriver.path).build()
    );
  });

  beforeEach(function() {
    var timeout = 20000;
    var driver = this.driver = new webdriver.Builder()
      .withCapabilities(webdriver.Capabilities.chrome())
      .build();

    this.timeout(timeout);

    driver.manage().timeouts().implicitlyWait(1000);

    return driver.get('file://' + path.resolve(__dirname, 'index.html'));
  });

  afterEach(function() {
    return this.driver.quit();
  });

  describe('basic operation', function() {

    beforeEach(function() {
      return setupPep(this.driver, {
          markup: '<div class="block pep">Mike rules</div>',
        }).then(function(peps) {
          this.peps = peps;
        }.bind(this));
    });

    it('enables dragging and dropping', function() {
      var driver = this.driver;
      var pep = this.peps[0];
      var origLocation;

      return pep.getLocation()
        .then(function(location) {
          origLocation = location;
          return driver.actions()
            .mouseDown(pep)
            .mouseMove({ x: 10, y: 20 })
            .perform();
        })
        // Wait before dropping to ensure easing does not take place.
        .then(function() {
          return driver.sleep(500);
        }).then(function() {
          return driver.actions().mouseUp().perform();
        }).then(function() {
          return pep.getLocation()
        }).then(function(newLocation) {
          assert.equal(origLocation.x + 10, newLocation.x);
          assert.equal(origLocation.y + 20, newLocation.y);
        });
    });
  });
});
