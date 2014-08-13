'use strict';
var assert = require('assert');

var webdriver = require('selenium-webdriver');

var setupDriver = require('./test-infra/setup-driver');
var setupPep = require('./test-infra/setup-pep');

describe('jQuery.pep', function() {
  var driver;

  setupDriver();

  beforeEach(function() {
    var timeout = 20000;

    driver = this.driver;
    driver.manage().timeouts().implicitlyWait(1000);

    this.timeout(timeout);
    return driver.get('http://localhost:8031/test/integration/index.html');
  });

  describe('default behavior', function() {
    this.timeout(15 * 1000);

    beforeEach(function() {
      return setupPep(driver, {
          markup: '<div class="block pep">O</div>',
        }).then(function(peps) {
          this.peps = peps;
        }.bind(this));
    });

    it('enables dragging and dropping', function() {
      var pep = this.peps[0];
      var origLocation;
      var start = Date.now();
      var log = function(msg) {
        console.log(msg, Date.now() - start);
      };

      return pep.getLocation()
        .then(function(location) {
          origLocation = location;
          log('starting to drag');
          return driver.actions()
            .mouseDown(pep)
            .mouseMove({ x: 10, y: 20 })
            .perform();
        }).then(function() {
          // Wait before dropping to prevent intertial movement. This magic
          // constant is unfortunate but unavoidable because there is no
          // external indication of the "momentum" of a given element.
          log('waiting');
          return driver.sleep(500);
        }).then(function() {
          log('releasing');
          return driver.actions().mouseUp().perform();
        }).then(function() {
          log('requesting location');
          return pep.getLocation();
        }).then(function(newLocation) {
          log('asserting');
          assert.equal(origLocation.x + 10, newLocation.x);
          assert.equal(origLocation.y + 20, newLocation.y);
        });
    });
  });
});
