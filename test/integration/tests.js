var assert = require('assert');
var wd = require('webdriver-sync');
var ChromeDriver = wd.ChromeDriver;
var driver = new ChromeDriver();

suite('stuff', function() {
  var driver;

  suiteSetup(function() {
    driver = new ChromeDriver();
  });

  suiteTeardown(function() {
    driver.quit();
  });

  test('mike', function() {
    driver.get('http://pep.briangonzalez.org/');
    console.log(driver.getTitle());
  });
});
