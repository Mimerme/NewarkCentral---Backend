var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsers = [];

//Socket events
//server message - message broadcasted to all users from the server
//user join - when the user specifies a nickname and joins the chat
//chat message - string broadcasted to all connected users

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('A user connected from ip: ' + socket.handshake.address);
  socket.on('disconnect', function(){
    console.log('a user disconnected');
  });
  socket.on('chat message', function(msg, nick){
    console.log('message: ' + msg);
    io.emit('chat message', msg, nick, getTimestamp());
  });
  socket.on('user join', function(nick){
  	connectedUsers.push(nick.toString());
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