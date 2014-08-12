'use strict';
var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

var Promise = require('bluebird');

module.exports = function(port) {
  var server = http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);

    fs.exists(filename, function(exists) {
      if(!exists) {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found\n");
        response.end();
        return;
      }

      if (fs.statSync(filename).isDirectory()) {
        filename += "/index.html";
      }

      console.log('Request: ' + filename);

      fs.readFile(filename, "binary", function(err, file) {
        console.log('response: ' + filename, 'error? ' + !!err);
        if(err) {
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }

        response.writeHead(200);
        response.write(file, "binary");
        response.end();
      });
    });
  });

  return new Promise(function(resolve, reject) {
    server.listen(port, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(server);
    });
  });
};
