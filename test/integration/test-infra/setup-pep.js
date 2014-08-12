/**
 * Initialize the current page according to the provided `options`.
 *
 * @param {WebDriver} driver
 * @param {Object} options
 * @param {string} options.markup
 * @param {string} [options.pepTarget] A CSS selector describing the elements
 *                                     that should be initialized as jQuery.pep
 *                                     instances. Defaults to '.pep'.
 * @param {Object} [options.pepOptions]
 *
 * @returns {Promise<Webdriver.WebElements>} The elements that have been
 *                                           initialized as jQuery.pep
 *                                           instances.
 */
'use strict';
var webdriver = require('selenium-webdriver');

module.exports = function(driver, options) {
  var markup = options.markup;
  var pepOptions = options.pepOptions || {};
  var pepTarget = options.pepTarget || '.pep';

  return driver.executeScript(function(markup, target) {
    $(document.body).html(markup)
      .find(target).pep();
  }, markup, pepTarget).then(function() {
    return driver.findElements(webdriver.By.css(pepTarget));
  });
};
