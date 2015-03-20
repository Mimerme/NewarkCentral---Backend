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

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var url = require('url');

//stores the rooms and their properties
var rooms = {};

//Complete test rewrite of easier to manage
//room hastable values

//rooms['roomname'].push

//Hastable of room example
/*{
  description: 'description'
  duration: 'duration'
  password: 'password'
  chatLog: []
  users: []
}
*/

//List of rooms and their descriptions
//var roomList = {};

//key - room : pair - chatlog of room in array form
//var roomChatLogs = {};

//Key - room : pair - array of user list for room
//var roomConnectedUsers = {};

//Key - room :: pair - how many hours are remaining for the room
//var roomLives = {};

  app.use(express.static(__dirname + '/CleanClient'));
  app.use(express.static(__dirname + '/public'));

  app.get('/chat', function(req, res){
        if(req.query.renewRoom != null){
            rooms[removeQuotes(req.query.renewRoom)].duration = 24;
            console.log("Renewing room "  + removeQuotes(req.query.renewRoom));
            res.sendFile(__dirname + '/renew.html');
            return;
        }

        if(req.query.createRoom != null){
          createRoom(removeQuotes(req.query.createRoom),
            removeQuotes(req.query.description),
            removeQuotes(req.query.lifetime));
            //Redirect the user to the room they just created
            res.statusCode = 302;
            res.setHeader("Location", '/chat?room=' + req.query.createRoom + '"');
            res.end();
        }
        res.sendFile(__dirname + '/CleanClient/CleanClient.html');
  });

  app.get('/', function(req, res){
      res.sendFile(__dirname + '/home.html');
  });

  app.get('/new', function(req, res){
      res.sendFile(__dirname + '/config.html');
  });

    //TODO remove createroom default
    createRoom('developer', 'Need help? Welcome to the developer chat room! ' +
    'Here I test out new features ' +
    'that are in development', 48);
    expirationManager();

  io.on('connection', function(socket){
    socket.on('UserConnectionAttempt', function(room, nickname){
      //Meaningless debug
      if(room == "" || nickname == ""){
        return;
      }

      if(rooms[room].users.indexOf(nickname) > -1){
        socket.emit('UserConnectionFailed', "nicknameExists");
        return;
      }
      console.log('User ' + nickname + ' is attempting to connect to ' +
        'room ' + room + ' from ip ' + socket.handshake.address);
      if(!hastableContains(rooms, room)){
        socket.emit('UserConnectionFailed', "roomNonExistant");
        return;
      }

      socket.join(room);
      //Tell the room who has walked in ;)
      sendServerMessage(nickname + " has joined room " + room, room);
      io.to(room).emit('userJoin', nickname);
      //Chat logs, users, description
      socket.emit('init', rooms[room].chatLog, rooms[room].users, rooms[room].description);
      //get userList array and push
      rooms[room].users.push(nickname);

      socket.on('disconnect', function(){
        //if the room was already destroyed
        if(rooms[room].users == null)
          return;

        var userList = rooms[room].users;
        userList = removeElement(nickname, userList);
        rooms[room].users = userList;
        io.to(room).emit('userLeave', userList, nickname);
      });
    });
    socket.on('OnChatMessage', function(room, message, nickname){
      sendChatMessage(message, room, nickname);
    });

  });
//process.env.PORT is used by heroku to specify
//what port to run the webapp on
  http.listen(process.env.PORT || 5000, function(){
    console.log('listening on port 5000');
  });

  function createRoom(mRoom, mDescription, mExpiration){
    if(mExpiration > 48)
    mExpiration = 48;

    if(hastableContains(rooms, mRoom))
      return;

    console.log('Creating new room ' + mRoom);
    var roomData = {
      description: mDescription,
      duration: mExpiration,
      password: 'password',
      chatLog: [],
      users: []
    };
    rooms[mRoom] = roomData;
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
      for (var key in rooms) {
        rooms[key].duration -= 1;
        if(rooms[key].duration <= 0){
          console.log("Room " + key + " has expired");
          io.emit()
          delete rooms[key];
          io.to(key).emit('OnRoomExpire');
        }
        else if(rooms[key].duration == 2){
          console.log('Room '  + key + ' is now renewable');
          io.to(key).emit('canRenew');
        }
      };
      //remove two more 0s
    }, 600000);
  }

  function sendServerMessage(message, room){
    io.to(room).emit('serverMessage', message);
  }

  function sendChatMessage(message, room, nickname){
    var timestamp = getTimestamp();
    //console.log(nickname + ' : ' + message + ' @ ' + timestamp);
    io.to(room).emit('chatMessage', message, nickname, timestamp);
    rooms[room].chatLog.push(message + "," + nickname + "," + timestamp);
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
