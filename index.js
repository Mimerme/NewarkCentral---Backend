var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsers = {};
var chatLog = [];
var chatLogTimeStamps = [];
var chatNicks = [];
var PORT = 6900;

//Socket events
//server message - message broadcasted to all users from the server
//user join - when the user specifies a nickname and joins the chat
//chat message - string broadcasted to all connected users
//join request - returns the values set when user was not here (ex. users, chat log, etc)

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('disconnect', function(){
    console.log(socket.id + ' : ' + connectedUsers[socket.id] + ' disconnected');
    io.emit('server message', 'User ' + connectedUsers[socket.id] + ' has left');
    delete connectedUsers[socket.id];
    io.emit('user leave', connectedUsers);
  });
  socket.on('chat message', function(msg, nick){
    var t = getTimestamp();
    console.log(nick + ' : ' + msg + ' @ ' + t);
    addMessage(msg, t, nick);
    io.to(roomname).emit('chat message', msg, nick, t);
  });
  //Client asks for basic information on the room
  socket.on('join request', function(roomname){
    socket.join(roomname);
      socket.emit('join request', connectedUsers, chatLog, chatLogTimeStamps, chatNicks, socket.id);
  });

  //When the user specifies their nickname
  socket.on('user join', function(nick, socketID, roomname){
      io.to(roomname).emit('server message', 'User ' + nick + ' has joined');
      io.to(roomname).emit('user join', nick);
      console.log("user '" + nick + "' with socket ID '" + socketID + "' has joined from ip: '" + socket.handshake.address + "' ");
      connectedUsers[socketID] = nick;
  });
});

http.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});

function getTimestamp(){
	return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') 
}

function addMessage(msg, time, nick){
  chatLog.push(msg);
  chatLogTimeStamps.push(time);
  chatNicks.push(nick);
}