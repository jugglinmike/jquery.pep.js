/*global module:false*/
module.exports = function(grunt) {

  process.env.SAUCE_USERNAME = process.env.SAUCE_USERNAME || 'jugglinmike';
  process.env.SAUCE_TUNNEL_ID = process.env.SAUCE_TUNNEL_ID ||
    (new Date()).getTime();
  // The Sauce access key is stored in an encrypted TravisCI configuration. It
  // may be manually specified to schedule test runs from development machines.

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
    },
    qunit: {
      files: ['test/unit/**/*.html']
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          ui: 'bdd'
        },
        src: ['test/integration/tests.js']
      }
    },
    jshint: {
      options: {
        curly: false,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: false,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {
        jQuery: true
      },
      src: ['src/**/*.js'],
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('ci', ['default', 'mochaTest']);

  // Default task.
  grunt.registerTask('default', ['jshint:src', 'qunit']);

  // Server Task
  grunt.registerTask('serve', 'Serves any directory on given port', function (env) {
    var shell = require('shelljs');
    var port  = grunt.option('port') || 8000;
    var dir   = grunt.option('dir')  || '.';
    console.log(['Serving', dir,'on port:', port].join(' '))
    shell.exec('cd '+ dir +' && python -m SimpleHTTPServer ' + port);
  });

};
