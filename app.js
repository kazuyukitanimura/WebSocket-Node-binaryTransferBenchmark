/**
 * Module dependencies.
 */

var fs = require('fs');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var WebSocketServer = require('websocket').server;

/**
 * ARGV Set
 */
var Protocol = process.argv[2] ? 'https': 'http' // the first argument
if (Protocol === 'https') {
  var ServerName = 'server';
  var options = {
    key: fs.readFileSync(ServerName + '.key'),
    cert: fs.readFileSync(ServerName + '.cert')
  };
}

if (cluster.isMaster) {

  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('death', function(worker) {
    console.log('worker ' + worker.pid + ' died');
  });

} else {
  var app = require(Protocol).createServer((Protocol === 'https') ? options: undefined);
  app.listen(8082);

  var wsServer = new WebSocketServer({
    httpServer: app,
    maxReceivedMessageSize: 0x40000000, // 1GiB
    assembleFragments: false // stream!!
  });

  wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    connection.on('frame', function(frame) {
      connection.sendFrame(frame);
    });
  });
}

