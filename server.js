var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var roomList = [];
var roomChatLogs = {};
var roomConnectedUsers = {};

  app.get('/', function(req, res){
    res.sendFile(__dirname + '/client.html');
  });

    //TODO remove createroom default
    createRoom('developer');

  io.on('connection', function(socket){
    socket.on('UserConnectionAttempt', function(room, nickname){
      console.log('User ' + nickname + ' is attempting to connect to ' + 
        'room ' + room + ' from ip ' + socket.handshake.address);
      if(roomList.indexOf(room) <= -1)
        socket.emit('UserConnectionFailed', "roomNonExistant");

      socket.join(room);
      sendServerMessage(nickname + " has joined room " + room, room);
      console.log(roomChatLogs);
      roomConnectedUsers[room].push(nickname);
      socket.emit('init', roomChatLogs[room], roomConnectedUsers[room]);
    });
    socket.on('OnChatMessage', function(room, message, nickname){
      sendChatMessage(message, room, nickname);
    });

  });

  http.listen(3000, function(){
    console.log('listening on *:3000');
  });

  function createRoom(room){
    if(roomList.indexOf(room) >= 0)
      return;
    console.log('Creating new room ' + room);
    roomChatLogs[room] = [];
    roomConnectedUsers[room] = [];
    roomList.push(room);
  }

  function sendServerMessage(message, room){
    io.to(room).emit('serverMessage', message);
  }

  function sendChatMessage(message, room, nickname){
    var timestamp = getTimestamp();
    console.log(nickname + ' : ' + message + ' @ ' + timestamp);
    io.to(room).emit('chatMessage', message, nickname, timestamp);
    roomChatLogs[room].push(message + "," + nickname + "," + timestamp);
  }

  function getTimestamp(){
    return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') 
  }