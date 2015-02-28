var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var roomList = [];

  app.get('/', function(req, res){
    res.sendFile(__dirname + '/client.html');
  });

  io.on('connection', function(socket){
    createRoom('room');
    socket.on('UserConnectionAttempt', function(room, nickname){
      console.log('User ' + nickname + ' is attempting to connect to ' + 
        'room ' + room + ' from ip ' + socket.handshake.address);
      if(roomList.indexOf(room) <= -1)
        socket.emit('UserConnectionFailed', "roomNonExistant");

      socket.join(room);
    });
    socket.on('OnChatMessage', function(room, message){
      sendChatMessage(message, room);
    });
  });

  http.listen(3000, function(){
    console.log('listening on *:3000');
  });

  function createRoom(room){
    roomList.push(room);
  }

  function sendServerMessage(message, room){
    io.to(room).emit('serverMessage', message);
  }

  function sendChatMessage(message, room){
    io.to(room).emit('chatMessage', message);
  }