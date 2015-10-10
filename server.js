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

//Library descriptions:
//Needed to cache rooms on update routines
var fs = require('fs');
var MongoClient = require("mongodb").MongoClient;
//Cause you know, express.js
var express = require('express');
//utilization
var app = express();
//We need this for requests
var http = require('http').Server(app);
//Sockets for the server
var io = require('socket.io')(http);

var get = require('http');

//stores the rooms and their properties
var rooms = {};

//Result in instant kick
var bannedWords = ["fuck", "bitch, btich", "nigger", "nigga", "fucker", "fuckboy", "fux", "fuk"];

//rewrite of easier to manage room hastable values
//Hastable of room example
/*{
  description: 'description'
  duration: 'duration'
  password: 'password'
  chatLog: []
  users: []
}
*/

MongoClient.connect("mongodb://newark:mememachine123@ds042138.mongolab.com:42138/newark", function (err, database) {
    if (err) {
        console.log("There was a problem trying to connect to the database " +
        "the application has bene terminated");
        throw err;
    } else {
      db = database;
        console.log("successfully connected to the database");

    }
});

//BEGIN UPDATE ROUTINE MANAGER
//Workaround heroku's 1 hr idle period
setInterval(function() {
    get.get("http://newarkcentral.herokuapp.com");
}, 300000);

//END UPDATE ROUTINE

//TODO : Clean up files and folders, both are only here to easily develop the client
  app.use(express.static(__dirname + '/CleanClient'));
  app.use(express.static(__dirname + '/CleanClient/Official'));
  app.use(express.static(__dirname + '/public'));

//BEGIN REQUEST HANDLER
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

  app.get('/chatOfficial', function(req, res){
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
        res.sendFile(__dirname + '/CleanClient/Official/CleanClient.html');
  });

  app.get('/', function(req, res){
      res.sendFile(__dirname + '/index.html');
      res.sendFile(__dirname + '/index.html');
  });

  app.get('/new', function(req, res){
      res.sendFile(__dirname + '/config.html');
  });

  //END REQUEST HANDLER

    //TODO remove createroom default
    createRoomSpecial('Newark', 'Welcome to the newark hub! Ask for help and other general questions about the city. Great for tourists!');
    createRoomSpecial('AskTheMayor', 'Ask the mayor anything, from political to personal issues.');
    createRoomSpecial('Jobs', 'Look for jobs thoughout the city, and see who responds');
    createRoomSpecial('Community', 'Discussions within the Newark community');
    createRoomSpecial('Transportation', "Discuss and ask quetions about the city's public transportation systems");
    createRoomSpecial('Education', "Discuss and ask quetions about the city's education systems");
    createRoomSpecial('Debate', "Debate controversial issues ");

//BEGIN CHAT SOCKET HANDLER
  io.on('connection', function(socket){
    socket.on('UserConnectionAttempt', function(room, nickname){
      //check if user is an official
      //TODO: check
      console.log(nickname);
      if(nickname.indexOf("!") === 0){
        db.collection('users').find({"nickCode": nickname.replace("!", "")}).forEach(function(u) {
          if(u.nickname !== null || typeof u.nickname !== 'undefined'){
            nickname = u.nickname;
            console.log(u.nickname);

            console.log(nickname);

            //Meaningless debug
            if(room == null || nickname == null){
              return;
            }

            if(!hastableContains(rooms, room)){
              socket.emit('UserConnectionFailed', "roomNonExistant");
              return;
            }

            if(rooms[room] == null)
              return;

            if(rooms[room].users.indexOf(nickname) > -1){
              socket.emit('UserConnectionFailed', "nicknameExists");
              return;
            }
            console.log('User ' + nickname + ' is attempting to connect to ' +
              'room ' + room);

            socket.join(room);
            //Tell the room who has walked in ;)
            sendServerMessage(nickname + " has joined room " + room, room);
            io.to(room).emit('userJoin', nickname);
            //Chat logs, users, description
            socket.emit('init', rooms[room].chatLog, rooms[room].users, rooms[room].description);
            //get userList array and push
            rooms[room].users.push(nickname);
          }
          });
      }
      else{
        console.log(nickname);

        if(nickname === "!xxxxxx"){
          name = "Mr.Mayor"
        }

        //Meaningless debug
        if(room == null || nickname == null){
          return;
        }

        if(!hastableContains(rooms, room)){
          socket.emit('UserConnectionFailed', "roomNonExistant");
          return;
        }

        if(rooms[room] == null)
          return;

        if(rooms[room].users.indexOf(nickname) > -1){
          socket.emit('UserConnectionFailed', "nicknameExists");
          return;
        }
        console.log('User ' + nickname + ' is attempting to connect to ' +
          'room ' + room);

        socket.join(room);
        //Tell the room who has walked in ;)
        sendServerMessage(nickname + " has joined room " + room, room);
        io.to(room).emit('userJoin', nickname);
        //Chat logs, users, description
        socket.emit('init', rooms[room].chatLog, rooms[room].users, rooms[room].description);
        //get userList array and push
        rooms[room].users.push(nickname);
      }

      socket.on('disconnect', function(){
        //if the room was already destroyed
        if(typeof rooms[room] === "undefined")
          return;

        if(rooms[room].user == null)
          return;

        var userList = rooms[room].users;
        userList = removeElement(nickname, userList);
        rooms[room].users = userList;
        io.to(room).emit('userLeave', userList, nickname);
      });
    });
    socket.on('OnChatMessage', function(room, message, nickname){
      var r = message.split(" ");
      for (var i = 0; i < r.length; i++) {
        if(bannedWords.indexOf(r) > -1){
          console.log("Filter: " + bannedWords[message]);
          return;
        }
      }
      sendChatMessage(message, room, nickname);
      //Administrator commands, accessable only from the specified network
      //as well as the specified room
      if((room == "terminal" && socket.request.headers['x-forwarded-for'] == "24.44.9.139") || socket.handshake.address =="127.0.0.1"){
        var args = message.split("|");
        switch(args[0]){
          case '/sendToAll':
            console.log('Broadcasting ' + args[1] + ' to all rooms');
            for(var room in rooms){
              sendServerMessage(args[1], room);
            }
            break;
          case '/save':
            console.log('Begining update routine');
            for(var room in rooms){
              sendServerMessage('All chatlogs and rooms will now be saved ' +
              'prepare for server update', room);
            }
            var lineOne = "";

            for(var room in rooms){
              lineOne += room + ":" + rooms[room].description + ";";
            }

            sendChatMessage(lineOne, 'terminal', 'Server');
            break;
          case '/dispose':
            console.log('Disposing of all save chatlogs and rooms');
            for(var room in rooms){
              sendServerMessage('The update is finished. All chatlogs ' +
              'have been disposed of', room);
            }
            if(fs.exists(__dirname + "/tmp/vars.txt")){
            fs.unlink(__dirname + "/tmp/vars.txt", function (err) {
              if (err) throw err;
              console.log('Successfully deleted update cache');
            });
            }
            break;
          case '/renew':
            renew(args[1]);
            break;
          default:
            console.log(message);
            break;
        }
      }
    });

  });

  //END CHAT SOCKET HANDLER
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

  function createRoomSpecial(mRoom, mDescription){

    if(hastableContains(rooms, mRoom))
      return;

    console.log('Creating new special room ' + mRoom);
    var roomData = {
      description: mDescription,
      duration: 999999999999999,
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


  function renew(data){
      console.log("Resuming update process...");

        var b = data.split(';');

        //-1 accounts for the dead line at the end of every file ;
        for(var i = 0; i < b.length - 1; i++){
          var splits = b[i].split(':');
          createRoom(splits[0], splits[1], 48);
        }
      console.log('Update routine complete. You may now dispose ' +
      'of the contents in the tmp folder');
  }
