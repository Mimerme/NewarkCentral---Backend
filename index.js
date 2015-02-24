var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsers = [];
var chatLog = [];
var chatLogTimeStamps = [];
var chatNicks = [];

//Socket events
//server message - message broadcasted to all users from the server
//user join - when the user specifies a nickname and joins the chat
//chat message - string broadcasted to all connected users
//join request - returns the values set when user was not here (ex. users, chat log, etc)

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('A user connected from ip: ' + socket.handshake.address);
  socket.on('disconnect', function(){
    console.log('a user disconnected');
  });
  socket.on('chat message', function(msg, nick){
    var t = getTimestamp();
    console.log(nick + ' : ' + msg + ' @ ' + t);
    addMessage(msg, t, nick);
    io.emit('chat message', msg, nick, t);
  });
  socket.on('join request', function(){
      console.log('returning connected users');
      socket.emit('join request', connectedUsers, chatLog, chatLogTimeStamps, chatNicks);
  });
  socket.on('user join', function(nick){
    connectedUsers.push(nick);
      io.emit('server message', 'User ' + nick + ' has joined');
      io.emit('user join', nick);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function getTimestamp(){
	return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') 
}

function addMessage(msg, time, nick){
  chatLog.push(msg);
  chatLogTimeStamps.push(time);
  chatNicks.push(nick);
}