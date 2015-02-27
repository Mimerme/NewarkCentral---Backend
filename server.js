var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var roomList = [];

  app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
  });

  io.on('connection', function(socket){
    socket.emit('init', roomList);
    socket.on('UserConnectionAttempt', function(room, nickname, password){

    });
  });

  http.listen(3000, function(){
    console.log('listening on *:3000');
  });