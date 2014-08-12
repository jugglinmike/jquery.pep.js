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
          markup: '<div class="block pep"></div>',
        }).then(function(peps) {
          this.peps = peps;
        }.bind(this));
    });

    it('enables dragging and dropping', function() {
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
