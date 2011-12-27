/**
 * Module dependencies.
 */

var fs = require('fs');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var WebSocketServer = require('websocket').server;
var net = require('net');

/**
 * ARGV Set
 */
if (process.argv[2]) { // the first argument
  var Protocol = require('https');
  var ServerName = 'server';
  var options = {
    key: fs.readFileSync(ServerName + '.key'),
    cert: fs.readFileSync(ServerName + '.cert')
  };
} else {
  var Protocol = require('http');
}

if (cluster.isMaster) {

  // Fork workers, numCPUs - 1
  for (var i = 1; i < numCPUs; i++) {
    cluster.fork();
  }
  //var server = net.createServer();
  //server.listen('./sock');
  //server.on('connection',function(socket){
  //  socket.on('data', function(data){
  //    console.log(data);
  //  });
  //  var b = new Buffer([1,2,3]);
  //  socket.write(b);
  //});

  cluster.on('death', function(worker) {
    console.log('worker ' + worker.pid + ' died. restart...');
    cluster.fork();
  });

} else {
  var app = Protocol.createServer((Protocol === 'https') ? options: undefined);
  app.listen(8082);

  var wsServer = new WebSocketServer({
    httpServer: app,
    maxReceivedMessageSize: 0x40000000, // 1GiB
    assembleFragments: false // stream!!
  });

  wsServer.on('request', function(request) {
    console.log('\nWorker ID: '+process.env.NODE_WORKER_ID);
    var connection = request.accept(null, request.origin);
    connection.on('frame', function(frame) {
      connection.sendFrame(frame);
    });
  });

  //var socket = net.connect('./sock');
  //var b = new Buffer([3,4,5]);
  //socket.write(b);
  //socket.on('data', function(data){
  //  console.log(data);
  //});
}

