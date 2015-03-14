/*The MIT License (MIT)

Copyright (c) [2015] [Andros Chu-Meng Yang]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Dear reader who either skipped the entire reading of the license or actually read it
to those whom it may concern server.js is the most up-to-date and complete early and cleaner rewrite compared
to index.js. Client.html's script was also a clean re-write early one
that is all*/

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');

//List of rooms and their descriptions
var roomList = {};

//key - room : pair - chatlog of room in array form
var roomChatLogs = {};

//Key - room : pair - array of user list for room
var roomConnectedUsers = {};

//Key - room :: pair - how many hours are remaining for the room
var roomLives = {};

  app.get('/chat', function(req, res){
        if(req.query.renewRoom != null){
            roomLives[removeQuotes(req.query.renewRoom)] = 24;
            console.log("Renewing room "  + removeQuotes(req.query.renewRoom));
            res.sendFile(__dirname + '/renew.html');
            return;
        }

        if(req.query)

        if(req.query.createRoom != null){
          createRoom(removeQuotes(req.query.createRoom),
            removeQuotes(req.query.description),
            removeQuotes(req.query.lifetime));
            //Redirect the user to the room they just created
            res.statusCode = 302;
            res.setHeader("Location", '/chat?room=' + req.query.createRoom + '"');
            res.end();
        }
        res.sendFile(__dirname + '/client.html');
  });

  app.get('/', function(req, res){
      res.sendFile(__dirname + '/home.html');
  });

  app.get('/new', function(req, res){
      res.sendFile(__dirname + '/config.html');
  });

    //TODO remove createroom default
    createRoom('developer', 'testing room for tests of testacular tests', 6);
    expirationManager();

  io.on('connection', function(socket){
    socket.on('UserConnectionAttempt', function(room, nickname){
      //Meaninless debug
      console.log('User ' + nickname + ' is attempting to connect to ' +
        'room ' + room + ' from ip ' + socket.handshake.address);
      if(!hastableContains(roomList, room)){
        socket.emit('UserConnectionFailed', "roomNonExistant");
        return;
      }

      socket.join(room);
      //Tell the room who has walked in ;)
      sendServerMessage(nickname + " has joined room " + room, room);
      io.to(room).emit('userJoin', nickname);
      socket.emit('init', roomChatLogs[room], roomConnectedUsers[room], roomList[room]);
      //get userList array and push
      roomConnectedUsers[room].push(nickname);

      socket.on('disconnect', function(){
        //if the room was already destroyed
        if(roomConnectedUsers[room] == null)
          return;

        var userList = roomConnectedUsers[room];
        userList = removeElement(nickname, userList);
        roomConnectedUsers[room] = userList;
        io.to(room).emit('userLeave', userList, nickname);
      });
    });
    socket.on('OnChatMessage', function(room, message, nickname){
      sendChatMessage(message, room, nickname);
    });

  });
//process.env.PORT is used by heroku
  http.listen(process.env.PORT || 5000, function(){
    console.log('listening on port 5000');
  });

  function createRoom(room, description, expiration){
    if(expiration > 48)
      expiration = 48;

    if(hastableContains(roomList, room))
      return;

    console.log('Creating new room ' + room);
    roomChatLogs[room] = [];
    roomConnectedUsers[room] = [];
    roomList[room] = description;
    roomLives[room] = expiration;
  }

  function removeElement(target, array){
    var i = array.indexOf(target);
    if(i != -1) {
      array.splice(i, 1);
    }
    return array;
  }

  function expirationManager(){
    console.log('Creating a new instance of the expirationManager');
    setInterval(function(){
      console.log('Running the expiration cycle');
      for (var key in roomLives) {
        roomLives[key] -= 1;
        if(roomLives[key] <= 0){
          console.log("Room " + key + " has expired");
          io.emit()
          delete roomLives[key];
          delete roomChatLogs[key];
          delete roomList[key];
          delete roomConnectedUsers[key];
          io.to(key).emit('OnRoomExpire');
        }
        else if(roomLives[key] == 2){
          console.log('Room '  + key + ' is now renewable');
          io.to(key).emit('canRenew');
        }
      };
      //two more 0s
    }, 6000);
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

  function hastableContains(hastable, value){
    return value in hastable;
  }

  function removeQuotes(string){
    if(string == null)
      return;

   return string.replace(new RegExp('"', 'g'), '');
  }
